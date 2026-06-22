/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from "react";
import MainWorkspace from "./components/MainWorkspace";

export default function App() {
  return (
    <div id="app-root" className="w-screen h-screen overflow-hidden bg-slate-950">
      <MainWorkspace />
    </div>
  );
}
