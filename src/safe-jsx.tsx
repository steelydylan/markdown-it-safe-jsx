import { Node, Parser } from "acorn";
import jsx from "acorn-jsx";
import { extend } from "acorn-jsx-walk";
import { base, simple } from "acorn-walk";
import type MarkdownIt from "markdown-it";
import ReactDOMServer from "react-dom/server";

extend(base);

function getSourceCode(node: Node, source: string) {
  return source.slice(node.start, node.end);
}

function evaluateExpression(node: Node, source: string) {
  if (node.type === "Literal") {
    return node.value;
  }
  if (node.type === "ArrayExpression") {
    return node.elements.map((element) =>
      evaluateExpression(element, source)
    );
  }
  if (node.type === "ObjectExpression") {
    const obj: Record<string, unknown> = {};
    node.properties.forEach((prop) => {
      if (prop.type === "Property") {
        if (prop.key.type === "Identifier") {
          obj[prop.key.name] = evaluateExpression(prop.value, source);
        } else if (prop.key.type === "Literal") {
          obj[prop.key.value] = evaluateExpression(prop.value, source);
        }
      }
    });
    return obj;
  }
  if (node.type === "ArrowFunctionExpression" || node.type === "FunctionExpression") {
    const functionString = getSourceCode(node, source);
    const func = new Function(`return ${functionString}`)();
    return func;
  }
  if (node.type === "TemplateLiteral") {
    let templateValue = "";
    node.quasis.forEach((part, index) => {
      templateValue += part.value.raw;
      if (index < node.expressions.length) {
        const exprValue = evaluateExpression(node.expressions[index], source);
        templateValue += exprValue;
      }
    });
    return templateValue;
  }
  return undefined;
}

function extractPropsFromJSX(jsxString: string) {
  const JSXParser = Parser.extend(jsx());
  const ast = JSXParser.parse(jsxString, {
    ecmaVersion: 2020,
    sourceType: "module",
  });
  const props: Record<string, unknown> = {};

  simple(ast, {
    JSXOpeningElement: (node) => {
      node.attributes.forEach((attr) => {
        if (attr.type === "JSXAttribute" && attr.value) {
          const propName = attr.name.name;
          let propValue;

          if (attr.value.type === "JSXExpressionContainer") {
            propValue = evaluateExpression(attr.value.expression, jsxString);
          } else {
            propValue = evaluateExpression(attr.value, jsxString);
          }

          props[propName] = propValue;
        }
      });
    },
  });

  return props;
}

export function safeJsx(
  md: MarkdownIt,
  components: {
    [key: string]: React.ComponentType<unknown>;
  },
  { unsafeRenderFunction = false } = {}
) {
  md.block.ruler.before(
    "paragraph",
    "jsx_block",
    (state, startLine, endLine, silent) => {
      const content = state.getLines(
        startLine,
        endLine,
        state.blkIndent,
        false
      );
      const match = content.match(/^<([A-Z]\w*)(.*?)<\/\1>/s);

      if (match) {
        const componentName = match?.[1]
        const Component = components[componentName];
        if (Component) {
          const allMatch = match?.[0];
          const props = extractPropsFromJSX(allMatch);
          const renderedComponent = ReactDOMServer.renderToString(
            <div
              data-component={componentName}
              data-props={JSON.stringify(props, (k, v) => {
                if (typeof v === "function" && unsafeRenderFunction) {
                  return v.toString();
                }
                return v;
              })}
            >
              <Component {...props} />
            </div>
          );
          if (!silent) {
            const token = state.push("html_block", "", 0);
            token.content = renderedComponent;
          }
          const lines = allMatch.split("\n");
          state.line = startLine + lines.length;
          return true;
        }
      }
      return false;
    }
  );
}
