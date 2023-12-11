## markdown-it-safe-jsx

```jsx
import MarkdownIt from 'markdown-it'
import { safeJsx } from 'markdown-it-safe-jsx'

import { TestComponent } from './TestComponent'

const md = new MarkdownIt()
md.use(safeJsx, {
  components: {
    TestComponent: (props) => <TestComponent {...props} />
  }
})
md.render(`<TestComponent test="test"></TestComponent>`)
```

### hydrate component

Sometimes You need to hydrate component, for example, if you want to use `useState` hook in your component.

```jsx

import MarkdownIt from 'markdown-it'
import { safeJsx, useHydrateJsx } from 'markdown-it-safe-jsx'

import { TestComponent } from './TestComponent'

function Markdown({ text }: { text: string }) {
  const ref = useRef<HTMLDivElement>(null);

  // hydrate component
  useHydrateJsx({
    components: {
      Test
    },
    ref,
  }, []);

  const result = useMemo(() => {
    const md = markdownIt({
      breaks: true,
      linkify: true,
      html: true,
    });
    md.use(safeJsx, {
      Test: (props: TestProps) => {
        return <Test {...props} />;
      }
    })
    return md.render(text);
  }, [text]);

  return (
    <div dangerouslySetInnerHTML={{ __html: result }} ref={ref}></div>
  )
}
```

### dangerously support function props

If you want to use function props, you can use `unsafeRenderFunction` and `unsafeHydrateFunction` options.

```jsx
import MarkdownIt from 'markdown-it'
import { safeJsx, useHydrateJsx } from 'markdown-it-safe-jsx'

import { TestComponent } from './TestComponent'

function Markdown({ text }: { text: string }) {
  const ref = useRef<HTMLDivElement>(null);

  // hydrate component
  useHydrateJsx({
    components: {
      Test
    },
    ref,
    unsafeHydrateFunction: true,
  }, []);

  const result = useMemo(() => {
    const md = markdownIt({
      breaks: true,
      linkify: true,
      html: true,
    });
    md.use(safeJsx, {
      Test: (props: TestProps) => {
        return <Test {...props} />;
      }
    }, {
      unsafeRenderFunction: true,
    })
    return md.render(text);
  }, [text]);

  return (
    <div dangerouslySetInnerHTML={{ __html: result }} ref={ref}></div>
  )
}
```