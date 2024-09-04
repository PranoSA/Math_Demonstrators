'use client';

import { useEffect, useState } from 'react';
import * as d3 from 'd3';

const NodeVisualization = () => {
  const [sliderValues, setSliderValues] = useState([1, 1, 1, 1, 1]);
  const [entropy, setEntropy] = useState(0);
  const [crossEntropy, setCrossEntropy] = useState(0);

  const handleSliderChange = (index: number, value: number) => {
    const newValues = [...sliderValues];
    newValues[index] = value;
    setSliderValues(newValues);
  };

  const softmax = (values: number[]) => {
    const expValues = values.map((v) => Math.exp(v));
    const sumExpValues = expValues.reduce((a, b) => a + b, 0);
    return expValues.map((v) => v / sumExpValues);
  };

  const calculateEntropy = (probabilities: number[]) => {
    return -probabilities.reduce((sum, p) => sum + p * Math.log(p), 0);
  };

  const calculateCrossEntropy = (probabilities: number[], target: number[]) => {
    return -target.reduce(
      (sum, t, i) => sum + t * Math.log(probabilities[i]),
      0
    );
  };

  useEffect(() => {
    const svg = d3
      .select('#d3-container')
      .attr('width', 800)
      .attr('height', 400);

    svg.selectAll('*').remove(); // Clear previous drawings

    const nodeData = sliderValues.map((value, index) => ({
      x: 200,
      y: 50 + index * 60,
      value,
    }));

    const softmaxValues = softmax(sliderValues);

    // Draw nodes
    svg
      .selectAll('circle')
      .data(nodeData)
      .enter()
      .append('circle')
      .attr('cx', (d) => d.x)
      .attr('cy', (d) => d.y)
      .attr('r', 20)
      .attr('fill', 'blue');

    // Draw lines
    svg
      .selectAll('line')
      .data(nodeData)
      .enter()
      .append('line')
      .attr('x1', (d) => d.x + 20)
      .attr('y1', (d) => d.y)
      .attr('x2', 400)
      .attr('y2', (d) => d.y)
      .attr('stroke', 'black');

    // Draw blocks with softmax values
    svg
      .selectAll('rect')
      .data(nodeData)
      .enter()
      .append('rect')
      .attr('x', 400)
      .attr('y', (d) => d.y - 20)
      .attr('width', 100)
      .attr('height', 40)
      .attr('fill', 'lightgrey');

    // Add text for softmax values
    svg
      .selectAll('text.softmax')
      .data(nodeData)
      .enter()
      .append('text')
      .attr('class', 'softmax')
      .attr('x', 410)
      .attr('y', (d) => d.y + 5)
      .text((d, i) => softmaxValues[i].toFixed(2))
      .attr('fill', 'black');

    // Add labels for slider values
    svg
      .selectAll('text.label')
      .data(nodeData)
      .enter()
      .append('text')
      .attr('class', 'label')
      .attr('x', (d) => d.x - 100)
      .attr('y', (d) => d.y + 5)
      .text((d, i) => `Value: ${sliderValues[i]}`)
      .attr('fill', 'black');

    // Calculate entropy and cross-entropy
    const entropyValue = calculateEntropy(softmaxValues);
    const targetDistribution = Array(sliderValues.length).fill(
      1 / sliderValues.length
    );
    const crossEntropyValue = calculateCrossEntropy(
      softmaxValues,
      targetDistribution
    );

    setEntropy(entropyValue);
    setCrossEntropy(crossEntropyValue);
  }, [sliderValues]);

  return (
    <div
      style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}
    >
      <div style={{ display: 'flex' }}>
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-around',
            marginRight: '20px',
          }}
        >
          {sliderValues.map((value, index) => (
            <div key={index} style={{ marginBottom: '20px' }}>
              <label>Node {index + 1}: </label>
              <input
                type="range"
                min="0"
                max="10"
                value={value}
                onChange={(e) => handleSliderChange(index, +e.target.value)}
              />
            </div>
          ))}
        </div>
        <svg id="d3-container"></svg>
      </div>
      <div style={{ marginTop: '20px' }}>
        <p>Entropy: {entropy.toFixed(2)}</p>
        <p>Cross-Entropy: {crossEntropy.toFixed(2)}</p>
      </div>
    </div>
  );
};

export default NodeVisualization;
