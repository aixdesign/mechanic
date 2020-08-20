import path from "path";
import { MechanicError } from "./mechanic-error";

/**
 * Extracts each design functions contexts and engine information
 * @param {function} context - webpack's require.context object,
 * used to require all index.js files in function folder.
 */
const requireFunctions = (context) => {
  const functions = {};
  const engines = {};
  context.keys().forEach((k) => {
    const key = path.dirname(k).split(path.sep).pop();
    functions[key] = context(k);
    const engine = functions[key].settings.engine;
    engines[key] = engine;
  });
  return { functions, engines };
};

/**
 * Sets up iframe's window functions that call
 * the corresponding engines and design functions.
 * @param {object} functions Object containing design functions contexts
 * @param {object} engines Object containing engines for each design function
 */
const setUp = (functions, engines) => {
  console.log("Setting up!");
  let curEngine = null;
  window.initEngine = (functionName) => {
    if (engines[functionName] === undefined) {
      window.run = () => {
        const p = document.createElement("p");
        p.textContent = `No engine to run for ${functionName}!`;
        document.body.appendChild(p);
      };
      throw new MechanicError(`No defined engine for: ${functionName}`);
    } else if (engines[functionName] !== curEngine) {
      console.log("Setting engine for:", functionName);
      // TODO: Kill existing sketch if running?
      curEngine = engines[functionName];
      window.run = (functionName, values, isPreview) => {
        // TODO: Do performance stats here?
        const func = functions[functionName];
        curEngine(functionName, func, values, isPreview);
      };
    }
  };
};

export { requireFunctions, setUp };
