import React, { useState, useEffect } from "react";

export const PromptForm = ({
  period,
  currentScaleRef,
  getTickLabel,
  highlightedPeriodRef,
  setShowForm,
  setPeriodTrigger,
  isScaleAdjustingRef,
  onPeriodChange,
  onClose,
  periodChangeViaForm,
}) => {
  const [startDate, setStartDate] = useState(period.startDate);
  const [endDate, setEndDate] = useState(period.endDate);

  const [startInput, setStartInput] = React.useState(
    getTickLabel(period.startDate, currentScaleRef.current)[0]
  );
  const [endInput, setEndInput] = React.useState(
    getTickLabel(period.endDate, currentScaleRef.current)[0]
  );

  const updateForm = async () => {
    if (periodChangeViaForm.current) {
      periodChangeViaForm.current = false;
      return;
    }
    let a = 1;
    while (isScaleAdjustingRef.current) {
      a += 1;
      await new Promise((resolve) => setTimeout(resolve, 100));
    }
    setStartDate(period.startDate);
    setEndDate(period.endDate);
    setStartInput(getTickLabel(period.startDate, currentScaleRef.current)[0]);
    setEndInput(getTickLabel(period.endDate, currentScaleRef.current)[0]);
  };

  useEffect(() => {
    if (
      period.startDate !== startDate ||
      period.endDate !== endDate ||
      getTickLabel(period.startDate, currentScaleRef.current)[0] !==
        startInput ||
      getTickLabel(period.endDate, currentScaleRef.current)[0] !== endInput
    ) {
      updateForm();
    }
  }, [period]);

  const getDateFromInput = (inputString) => {
    const dateTextComponents = inputString.split("/");
    let d = parseInt(
      dateTextComponents[dateTextComponents.length - 3] || 1,
      10
    );
    let m =
      parseInt(dateTextComponents[dateTextComponents.length - 2] || 1, 10) - 1;
    let y = parseInt(
      dateTextComponents[dateTextComponents.length - 1] ||
        new Date().getFullYear(),
      10
    );
    if (inputString.split("B")[1]) {
      y = -y + 1;
    }
    if (y === 0) {
      if (!m) {
        m = 1;
      }
      if (!d) {
        d = 1;
      }
      let formattedMonth = m < 10 ? "0" + m : m.toString();
      let formattedDay = d < 10 ? "0" + d : d.toString();
      return new Date(`0000-${formattedMonth}-${formattedDay}`);
    } else {
      return new Date(y, m, d);
    }
  };

  const handleCommit = () => {
    isScaleAdjustingRef.current = true;
    periodChangeViaForm.current = true;
    try {
      const newStartDate = getDateFromInput(startInput);
      const newEndDate = getDateFromInput(endInput);
      if (newStartDate > newEndDate) {
        throw new Error("Start date cannot be greater than end date.");
      } else if (newStartDate === newEndDate) {
        throw new Error("Start date cannot be equal to end date.");
      }
      onPeriodChange(
        { startDate: newStartDate, endDate: newEndDate },
        highlightedPeriodRef,
        setPeriodTrigger
      );
    } catch (error) {
      console.error("Invalid date entered:", error.message);
    }
  };

  const [selectedTopics, setSelectedTopics] = useState([]);
  const [selectedRegions, setSelectedRegions] = useState([]);
  const [selectedLength, setSelectedLength] = useState("0-200");
  const [summary, setSummary] = useState("");

  const handleTopicChange = (event) => {
    const { value, checked } = event.target;
    setSelectedTopics((prev) =>
      checked ? [...prev, value] : prev.filter((topic) => topic !== value)
    );
  };

  const handleRegionChange = (event) => {
    const { value, checked } = event.target;
    setSelectedRegions((prev) =>
      checked ? [...prev, value] : prev.filter((region) => region !== value)
    );
  };

  const handleLengthChange = (event) => {
    setSelectedLength(event.target.value);
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (highlightedPeriodRef.current) {
      const data = {
        topics: selectedTopics,
        regions: selectedRegions,
        length: selectedLength,
        period: { start: startInput, end: endInput },
      };
      try {
        const response = await fetch("/getInfo", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(data),
        });
        const result = await response.json();
        setSummary(result.summary);
      } catch (error) {
        setSummary("Error fetching data. Please try again.", error);
      }
    }
  };

  return (
    <div className="prompt-form">
      <h3>Selected Period</h3>
      <label>
        Start Year:
        <input
          type="text"
          value={startInput}
          onChange={(e) => setStartInput(e.target.value)}
          placeholder="e.g., -5000 or 2024"
        />
      </label>
      <label>
        End Year:
        <input
          type="text"
          value={endInput}
          onChange={(e) => setEndInput(e.target.value)}
          placeholder="e.g., -4990 or 2030"
        />
      </label>
      <button onClick={handleCommit}>Change period</button>
      <button
        onClick={() =>
          onClose(highlightedPeriodRef, setPeriodTrigger, setShowForm)
        }
      >
        Close
      </button>
      <div className="query-options-container">
        <h3>Select Topics (You can choose multiple):</h3>
        <div>
          {[
            "Politics & Governance",
            "Society & Culture",
            "Science & Technology",
            "Economy & Trade",
            "Philosophy & Religion",
          ].map((topic) => (
            <label key={topic}>
              <input
                type="checkbox"
                value={topic}
                onChange={handleTopicChange}
              />{" "}
              {topic}
            </label>
          ))}
        </div>

        <h3>Select Regions (You can choose multiple):</h3>
        <div>
          {["Europe", "Asia", "Africa", "The Americas", "Oceania"].map(
            (region) => (
              <label key={region}>
                <input
                  type="checkbox"
                  value={region}
                  onChange={handleRegionChange}
                />{" "}
                {region}
              </label>
            )
          )}
        </div>

        <h3>Select Length of Description:</h3>
        <select onChange={handleLengthChange} value={selectedLength}>
          <option value="0-200">0-200 words</option>
          <option value="200-500">200-500 words</option>
          <option value="500-1000">500-1000 words</option>
          <option value="1000-5000">1000-5000 words</option>
          <option value="5000+">5000+ words</option>
        </select>

        {/* Submit Button */}
        <button type="submit" onClick={handleSubmit}>
          Get Information
        </button>

        {/* Display the summary result */}
        {summary && <div className="result-box">{summary}</div>}
      </div>
    </div>
  );
};
