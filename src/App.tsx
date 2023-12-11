import { useMemo, useRef } from "react";
import markdownIt from "markdown-it";
import { Test, TestProps } from "./Test";
import { safeJsx, useHydrateJsx } from ".";

export default function App() {
  const ref = useRef<HTMLDivElement>(null);
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
    return md.render(`## hello 
<Test test="world"></Test>`)
  }, []);

  return (
    <div dangerouslySetInnerHTML={{ __html: result }} ref={ref}></div>
  )
}