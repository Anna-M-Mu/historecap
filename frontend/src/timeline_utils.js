import * as d3 from "d3";

export const calculateHighlightedPeriod = (clickX, currentScale) => {
  const clickedDate = currentScale.invert(clickX);
  const ticks = currentScale.ticks(getTickFormat(currentScale));
  let startDate = null;
  let endDate = null;
  for (let i = 0; i < ticks.length - 1; i++) {
    if (clickedDate >= ticks[i] && clickedDate < ticks[i + 1]) {
      startDate = ticks[i];
      endDate = ticks[i + 1];
      break;
    }
  }
  return { startDate, endDate };
};

export const determineScaleForPeriod = (highlightedPeriodRef) => {
  if (
    !highlightedPeriodRef.current.startDate ||
    !highlightedPeriodRef.current.endDate
  )
    return;
  const start = highlightedPeriodRef.current.startDate;
  const end = highlightedPeriodRef.current.endDate;
  const duration =
    highlightedPeriodRef.current.endDate -
    highlightedPeriodRef.current.startDate;
  let newScale;
  newScale = d3.scaleTime().domain([start, end]);
  return newScale;
};

export const drawHighlight = (svg, alternativePeriod, scale, height) => {
  if (alternativePeriod) {
    const startX = scale(alternativePeriod.startDate);
    const endX = scale(alternativePeriod.endDate);
    svg.selectAll(".highlight-area").remove();

    svg
      .append("rect")
      .attr("class", "highlight-area")
      .attr("x", startX)
      .attr("y", height / 2 - 10)
      .attr("width", endX - startX)
      .attr("height", 20)
      .attr("fill", "rgba(107, 142, 35, 0.3)")
      .attr("rx", 4)
      .attr("ry", 4);
  }
};

export const drawLine = (svg, height, width) => {
  svg
    .append("line")
    .attr("x1", 0)
    .attr("y1", height / 2)
    .attr("x2", width)
    .attr("y2", height / 2)
    .attr("stroke", "black")
    .attr("stroke-width", 2);
};
export const getTickFormat = (scale) => {
  const oneYearMs = 366 * 24 * 60 * 60 * 1000;
  const domainLength = scale.domain()[1] - scale.domain()[0];
  if (domainLength <= 31.5 * 24 * 60 * 60 * 1000) {
    return d3.timeDay.every(1);
  } else if (domainLength <= oneYearMs) {
    return d3.timeMonth.every(1);
  } else if (domainLength <= 10 * oneYearMs) {
    return d3.timeYear.every(1);
  } else if (domainLength <= 100 * oneYearMs) {
    return d3.timeYear.every(10);
  } else {
    return d3.timeYear.every(
      Math.pow(10, Math.floor(Math.log10(domainLength / oneYearMs)))
    );
  }
};

export const getTickLabel = (d, scale) => {
  const domainLength = scale.domain()[1] - scale.domain()[0];
  const year = d.getFullYear() - (d.getFullYear() <= 0 ? 1 : 0);
  const astronomicalYear = d.getFullYear();
  const month = d.getMonth() + 1;
  const day = d.getDate();

  const julianDate = new Date(d);
  const marchFirst = new Date(year, 2, 1);
  let julianDay;
  let julianMonth;
  let julianYear;
  const dateGapNotTooBig = year >= -7501 && year < 41000;

  if (dateGapNotTooBig) {
    if (
      astronomicalYear % 100 !== 0 ||
      (astronomicalYear % 100 === 0 && astronomicalYear % 400 === 0)
    ) {
      const div100Int = Math.floor(astronomicalYear / 100);
      const div400Int = Math.floor(astronomicalYear / 400);
      const gap = div100Int - div400Int - 2;
      julianDate.setDate(julianDate.getDate() - gap);
      julianYear = julianDate.getFullYear();
      julianMonth = julianDate.getMonth() + 1;
      julianDay = julianDate.getDate();
    } else if (astronomicalYear % 100 === 0 && astronomicalYear % 400 !== 0) {
      const div100Int = Math.floor(astronomicalYear / 100);
      const div400Int = Math.floor(astronomicalYear / 400);
      const gapAfterGapIncrease = div100Int - div400Int - 2;
      const gapBeforeGapIncrease = div100Int - div400Int - 3;
      const gapIncreaseDate = new Date(marchFirst);
      gapIncreaseDate.setDate(marchFirst.getDate() + gapBeforeGapIncrease);
      if (d > gapIncreaseDate) {
        julianDate.setDate(julianDate.getDate() - gapAfterGapIncrease);
        julianYear = julianDate.getFullYear();
        julianMonth = julianDate.getMonth() + 1;
        julianDay = julianDate.getDate();
      } else if (d.getTime() === gapIncreaseDate.getTime()) {
        julianYear = year;
        julianMonth = 2;
        julianDay = 29;
      } else if (d < gapIncreaseDate) {
        julianDate.setDate(julianDate.getDate() - gapBeforeGapIncrease);
        julianYear = julianDate.getFullYear();
        julianMonth = julianDate.getMonth() + 1;
        julianDay = julianDate.getDate();
      }
    }
  }
  let yearAdjusted;
  let julianYearAdjusted;
  let lines = [];
  if (domainLength <= 31.5 * 24 * 60 * 60 * 1000) {
    if (year < 0) {
      yearAdjusted = `${-year}BCE`;
      lines.push(`${day}/${month}/${yearAdjusted}`);
    } else {
      lines.push(`${day}/${month}/${year}`);
    }
    if (dateGapNotTooBig) {
      if (julianYear < 0) {
        julianYearAdjusted = `${-julianYear}BCE`;
        lines.push(`${day}/${month}/${julianYearAdjusted}`);
      } else {
        lines.push(`${day}/${month}/${julianYear}`);
      }
    }
  } else if (domainLength <= 366 * 24 * 60 * 60 * 1000) {
    if (year < 0) {
      yearAdjusted = `${-year}BCE`;
      lines.push(`${month}/${yearAdjusted}`);
    } else {
      lines.push(`${month}/${year}`);
    }
  } else {
    if (year < 0) {
      yearAdjusted = `${-year}BCE`;
      lines.push(`${yearAdjusted}`);
    } else {
      lines.push(`${year}`);
    }
  }
  return lines;
};

export const drawAreaForClickListening = (
  svg,
  height,
  width,
  currentScaleRef,
  highlightedPeriodRef,
  setPeriodTrigger,
  isScaleAdjustingRef
) => {
  svg
    .append("rect")
    .attr("class", "keep")
    .attr("width", width)
    .attr("height", height)
    .attr("fill", "none")
    .attr("pointer-events", "all")
    .on("click", function (event) {
      handleHighlightClick(
        event,
        currentScaleRef,
        highlightedPeriodRef,
        setPeriodTrigger,
        isScaleAdjustingRef
      );
    });
};

export const drawMarksAndLabels = (svg, height, scale) => {
  const visibleDates = scale.ticks(getTickFormat(scale));

  svg.selectAll(".timeline-mark").remove();
  svg.selectAll(".timeline-label").remove();

  svg
    .selectAll(".timeline-mark")
    .data(visibleDates)
    .enter()
    .append("rect")
    .attr("class", "timeline-mark")
    .attr("x", (d) => scale(d))
    .attr("y", height / 2 - 10)
    .attr("width", 3)
    .attr("height", 20)
    .attr("fill", "#6b8e23")
    .attr("rx", 2)
    .attr("ry", 2);

  svg
    .selectAll(".timeline-label")
    .data(visibleDates)
    .enter()
    .append("text")
    .attr("class", "timeline-label")
    .attr("x", (d) => scale(d))
    .attr("y", height / 2 + 30)
    .attr("text-anchor", "middle")
    .each(function (d) {
      const domainLength = scale.domain()[1] - scale.domain()[0];
      const label = d3.select(this);
      const labelLines = getTickLabel(d, scale);
      if (
        domainLength <= 31.5 * 24 * 60 * 60 * 1000 &&
        domainLength > 15 * 24 * 60 * 60 * 1000
      ) {
        const fontSize = Math.floor(
          200 / (domainLength / (24 * 60 * 60 * 1000))
        );
        labelLines.forEach((line, i) => {
          label
            .append("tspan")
            .attr("x", scale(d))
            .attr("dy", i === 0 ? "0em" : "1.2em")
            .style("font-size", `${fontSize}px`)
            .text(line);
        });
      } else {
        labelLines.forEach((line, i) => {
          label
            .append("tspan")
            .attr("x", scale(d))
            .attr("dy", i === 0 ? "0em" : "1.2em")
            .text(line);
        });
      }
    });
};

export const handleHighlightClick = (
  event,
  currentScaleRef,
  highlightedPeriodRef,
  setPeriodTrigger,
  isScaleAdjustingRef
) => {
  const currentScale = currentScaleRef.current;
  if (!currentScale) return;
  const [clickX] = d3.pointer(event);
  const { startDate, endDate } = calculateHighlightedPeriod(
    clickX,
    currentScale
  );
  if (startDate && endDate) {
    isScaleAdjustingRef.current = true;
    highlightedPeriodRef.current = { startDate, endDate };
    setPeriodTrigger({ startDate, endDate });
  }
};

export const handlePeriodChange = (
  newPeriod,
  highlightedPeriodRef,
  setPeriodTrigger
) => {
  highlightedPeriodRef.current = newPeriod;
  setPeriodTrigger(newPeriod);
};

export const handleCloseForm = (
  highlightedPeriodRef,
  setPeriodTrigger,
  setShowForm
) => {
  highlightedPeriodRef.current = null;
  setPeriodTrigger(null);
  setShowForm(false);
};
