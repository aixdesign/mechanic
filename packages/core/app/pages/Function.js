import React, { useState, useRef, useEffect } from "react";
import PropTypes from "prop-types";
import classnames from "classnames";

import { useValues } from "./utils/useValues.js";
import { getPossiblePresets, addPresetsAsSources } from "./utils/presets.js";
import { useShortcuts } from "./utils/useShortcuts.js";

import { Button, Toggle, ParamInput } from "@mechanic-design/ui-components";
import * as css from "./Function.module.css";

export const Function = ({ name, exports: functionExports, children }) => {
  const [iframeLoaded, setIframeLoaded] = useState(false);
  const [scaleToFit, setScaleToFit] = useState(true);
  const [autoRefreshOn, setAutoRefreshOn] = useState(true);

  const mainRef = useRef();
  const iframe = useRef();
  const lastRun = useRef();

  const {
    params,
    presets: exportedPresets,
    settings: { usesRandom }
  } = functionExports;
  const presets = getPossiblePresets(exportedPresets ?? {});
  const canScale = !!(params.width && params.height);
  const [values, setValues] = useValues(name, params);
  const handleOnChange = (e, name, value) => {
    const sources = [{ [name]: value }];
    if (name === "preset") addPresetsAsSources(value, exportedPresets, params, sources);
    setValues(values => Object.assign({}, values, ...sources));
  };

  const prepareValues = (useScale, useRandomSeed) => {
    const valuesCopy = Object.assign({}, values);
    if (useScale && canScale && scaleToFit) {
      const bounds = mainRef.current.getBoundingClientRect();
      valuesCopy.scaleToFit = {
        width: bounds.width - 100,
        height: bounds.height - 100
      };
    }
    if (useRandomSeed && lastRun.current?.values) {
      valuesCopy.randomSeed = lastRun.current.values.randomSeed;
    }
    return valuesCopy;
  };

  const handlePreview = async () => {
    const valuesCopy = prepareValues(true, false);
    lastRun.current = iframe.current.contentWindow?.run?.(name, valuesCopy, true);
  };

  const handleAutoPreview = async () => {
    const valuesCopy = prepareValues(true, true);
    lastRun.current = iframe.current.contentWindow?.run?.(name, valuesCopy, true);
  };

  const handleExport = async () => {
    const valuesCopy = prepareValues(false, true);
    iframe.current.contentWindow?.run?.(name, valuesCopy);
  };

  useEffect(() => {
    if (autoRefreshOn && iframeLoaded) handleAutoPreview();
  });

  // Check when iframe is done loading
  useEffect(() => {
    const onLoad = () => setIframeLoaded(true);
    iframe.current?.addEventListener?.("load", onLoad);
    return () => {
      iframe.current?.removeEventListener?.("load", onLoad);
    };
  }, [name]);

  useShortcuts(handleExport);

  return (
    <div className={css.root}>
      <aside className={css.aside}>
        <div className={css.section}>{children}</div>
        <div className={css.sep} />

        <div className={classnames(css.edge, css.top)} />
        <div className={css.params}>
          <ParamInput
            className={css.param}
            key="param-preset"
            name="preset"
            values={values}
            attributes={{ type: "string", options: presets, default: presets[0] }}
            onChange={handleOnChange}
          />
          {Object.entries(params).map(([name, param]) => (
            <ParamInput
              className={css.param}
              key={`param-${name}`}
              name={name}
              values={values}
              attributes={param}
              onChange={handleOnChange}
            />
          ))}
        </div>
        <div className={classnames(css.edge, css.bottom)} />

        <div className={css.section}>
          <div className={css.row}>
            <Toggle
              status={canScale && scaleToFit}
              disabled={!canScale}
              onClick={() => setScaleToFit(scaleToFit => !scaleToFit)}>
              {canScale ? (scaleToFit ? "Scale to fit On" : "Scale to fit Off") : "Scale to Fit"}
            </Toggle>
            {!canScale && <span className={css.error}>Params missing for scaling</span>}
          </div>
          <div className={css.sep} />
          <div className={css.row}>
            <Toggle
              className={css.grow}
              status={autoRefreshOn}
              onClick={() => setAutoRefreshOn(autoRefreshOn => !autoRefreshOn)}
              disabled={!iframeLoaded}>
              {iframeLoaded ? "Auto-refresh" : "Loading content"}
            </Toggle>
          </div>
          <div className={css.sep} />
          <div className={css.row}>
            <Button className={css.grow} onClick={handlePreview} disabled={!iframeLoaded}>
              {iframeLoaded ? (usesRandom ? "Preview / Randomize" : "Preview") : "Loading content"}
            </Button>
          </div>
          <div className={css.sep} />
          <div className={css.row}>
            <Button
              className={css.grow}
              primary={iframeLoaded}
              onClick={handleExport}
              disabled={!iframeLoaded}>
              {iframeLoaded ? "Export" : "Loading content"}
            </Button>
          </div>
          <div className={css.sep} />
        </div>
      </aside>
      <main className={css.main} ref={mainRef}>
        <iframe
          title={`Design function ${name} document.`}
          src={`${name}.html`}
          className={css.iframe}
          ref={iframe}
        />
      </main>
    </div>
  );
};

Function.propTypes = {
  name: PropTypes.string.isRequired,
  exports: PropTypes.shape({
    handler: PropTypes.func.isRequired,
    params: PropTypes.object.isRequired,
    settings: PropTypes.object.isRequired
  })
};