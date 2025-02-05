import React, { useEffect, useRef, useState } from "react";
import ReactDOM from "react-dom/client";
import * as d3 from "d3";
import * as tu from "./timeline_utils";
import { PromptForm } from "./form";

const Timeline = () => {
  const width = window.innerWidth;
  const height = 200;
  const zoomRef = useRef(null);
  const svgRef = useRef();
  const periodChangeViaForm = useRef(false);
  const highlightedPeriodRef = useRef(null);
  const [periodTrigger, setPeriodTrigger] = useState(null);
  const [showForm, setShowForm] = useState(false);
  let isScaleAdjustingRef = useRef(false);
  const initialScale = d3
    .scaleTime()
    .domain([new Date(1900, 0, 1), new Date(2020, 0, 1)])
    .range([0, width]);
  const currentScaleRef = useRef(initialScale);

  useEffect(() => {
    const svg = d3.select(svgRef.current);
    if (!highlightedPeriodRef.current) {
      svg.selectAll(".highlight-area").remove();
      return;
    }

    let adjustedScale;
    adjustedScale = tu.determineScaleForPeriod(highlightedPeriodRef);
    if (adjustedScale && adjustedScale.domain()) {
      const scaleFactor =
        (initialScale.domain()[1] - initialScale.domain()[0]) /
        (adjustedScale.domain()[1] - adjustedScale.domain()[0]);

      const newX = -initialScale(adjustedScale.domain()[0]) * scaleFactor;
      svg
        .transition()
        .duration(300)
        .ease(d3.easeCubicInOut)
        .call(
          zoomRef.current.transform,
          d3.zoomIdentity.translate(newX, 0).scale(scaleFactor)
        )
        .on("end", () => {
          isScaleAdjustingRef.current = false;
          if (!showForm) {
            setShowForm(true);
          }
        });
    }
  }, [periodTrigger]);

  useEffect(() => {
    const svg = d3.select(svgRef.current);
    svg
      .selectAll("*")
      .filter((d, i, nodes) => {
        return !d3.select(nodes[i]).classed("keep");
      })
      .remove();
    tu.drawAreaForClickListening(
      d3.select(svgRef.current),
      height,
      width,
      currentScaleRef,
      highlightedPeriodRef,
      setPeriodTrigger,
      isScaleAdjustingRef
    );

    tu.drawLine(svg, height, width);
    tu.drawMarksAndLabels(svg, height, currentScaleRef.current);
    if (!zoomRef.current) {
      zoomRef.current = d3
        .zoom()
        .scaleExtent([0.001, 50000])
        .translateExtent([
          [-Infinity, 0],
          [Infinity, height],
        ])
        .on("zoom", (event) => {
          currentScaleRef.current = event.transform.rescaleX(initialScale);
          tu.drawMarksAndLabels(svg, height, currentScaleRef.current);
          if (highlightedPeriodRef.current) {
            const domainStart = currentScaleRef.current.domain()[0];
            const domainEnd = currentScaleRef.current.domain()[1];
            const periodStart = highlightedPeriodRef.current.startDate;
            const periodEnd = highlightedPeriodRef.current.endDate;
            const isCompletelyOutOfDomain =
              periodEnd <= domainStart || periodStart >= domainEnd;
            if (!isCompletelyOutOfDomain) {
              const altStart = new Date(
                Math.max(domainStart.getTime(), periodStart.getTime())
              );
              const altEnd = new Date(
                Math.min(domainEnd.getTime(), periodEnd.getTime())
              );
              const altPeriod = { startDate: altStart, endDate: altEnd };
              tu.drawHighlight(svg, altPeriod, currentScaleRef.current, height);
            } else {
              svg.selectAll(".highlight-area").remove();
            }
          }
        });
    }

    svg.call(zoomRef.current);

    tu.drawMarksAndLabels(svg, height, initialScale);

    svg
      .transition()
      .duration(0)
      .call(
        zoomRef.current.transform,
        d3.zoomIdentity.translate(0, 0).scale(1)
      );
  }, [width, height]);

  return (
    <div style={{ width: "100%" }}>
      <h2>
        Welcome to <span className="bold-text">Historecap!</span>
        <br />
        Here you can get a short summary of information regarding a historical
        period. <br />
        You can select a period by clicking on the timeline between two ticks.
        <br />
        When you see the form, you can modify the dates using the same format as
        the timeline labels:
        <br />
        <span className="bold-text">d/m/y</span>,{" "}
        <span className="bold-text">m/y</span>, or{" "}
        <span className="bold-text">y</span>.
        <br />
        You can zoom in and out to see more granular ticks.
        <br />
        For some dates, a proleptic <span className="bold-text">
          Julian
        </span>{" "}
        calendar date is shown below the proleptic{" "}
        <span className="bold-text">Gregorian</span> calendar date.
        <br />
        <span className="bold-text">Disclaimer: </span>This app uses{" "}
        <span className="bold-text">Together AI</span> to generate results, and{" "}
        <span className="bold-text">I cannot guarantee their accuracy</span>. It
        is intended as a prototype and may evolve into a more refined project in
        the future.
        <br />
        To use the app, you must obtain an{" "}
        <span className="bold-text">API key</span> and add it to your{" "}
        <span className="bold-text">.env</span> file inside the root folder.
      </h2>
      <svg ref={svgRef}></svg>
      {showForm && highlightedPeriodRef.current && (
        <PromptForm
          period={periodTrigger}
          currentScaleRef={currentScaleRef}
          getTickLabel={tu.getTickLabel}
          highlightedPeriodRef={highlightedPeriodRef}
          setShowForm={setShowForm}
          setPeriodTrigger={setPeriodTrigger}
          isScaleAdjustingRef={isScaleAdjustingRef}
          onPeriodChange={tu.handlePeriodChange}
          onClose={tu.handleCloseForm}
          periodChangeViaForm={periodChangeViaForm}
        />
      )}
    </div>
  );
};

const root = ReactDOM.createRoot(document.getElementById("root"));
root.render(<Timeline />);
