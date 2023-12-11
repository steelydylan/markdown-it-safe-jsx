import { useState } from "react";


export type TestProps = {
  test: string;
}


export function Test({ test }: TestProps) {
  const [state, setState] = useState(0);
  return (
    <div>
      {test}
      <button onClick={() => setState(state + 1)}>{state}</button>
    </div>
  )
}