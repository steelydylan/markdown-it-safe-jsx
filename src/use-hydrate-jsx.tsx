import React, { RefObject, useEffect } from "react";
import { Root, hydrateRoot } from "react-dom/client";

type Props = {
  components: {
    [key: string]: React.ComponentType<any>;
  };
  ref: RefObject<HTMLDivElement>;
  unsafeHydrateFunction?: boolean;
};

export function useHydrateJsx(
  { components, ref, unsafeHydrateFunction = false }: Props,
  deps: unknown[] = []
) {
  useEffect(() => {
    if (!ref?.current) return;
    const roots: Root[] = [];
    ref.current.querySelectorAll("[data-component]").forEach((element) => {
      const componentName = element.getAttribute("data-component");
      if (!componentName) return;
      const propsString = element.getAttribute("data-props");
      const Component = components[componentName];
      const props = propsString
        ? JSON.parse(propsString, function (k, v) {
            if (typeof v === "string" && v.match(/^function/) && unsafeHydrateFunction) {
              return Function.call(this, "return " + v)();
            }

            return v;
          })
        : {};
      if (Component) {
        const root = hydrateRoot(element, <Component {...props} />);
        roots.push(root);
      }
    });
    // return () => {
    //   roots.forEach((root) => {
    //     root.unmount();
    //   });
    // };
  }, deps);
}
