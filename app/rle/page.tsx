'use client';

import { useState } from 'react';

const binaryRepresentation = (str: string) => {
  return str
    .split('')
    .map((char) => char.charCodeAt(0).toString(2).padStart(8, '0'))
    .join(' ');
};

const dictionaryEncoding = (str: string, windowSize: number) => {
  const encodedPairs: { length: number; distance: number; text: string }[] = [];
  let i = 0;

  while (i < str.length) {
    let matchLength = 0;
    let matchDistance = 0;

    for (let j = 1; j <= windowSize && i - j >= 0; j++) {
      let k = 0;
      while (k < windowSize && str[i + k] === str[i - j + k]) {
        k++;
      }
      if (k > matchLength) {
        matchLength = k;
        matchDistance = j;
      }
    }

    if (matchLength > 0) {
      encodedPairs.push({
        length: matchLength,
        distance: matchDistance,
        text: str.slice(i, i + matchLength),
      });
      i += matchLength;
    } else {
      encodedPairs.push({
        length: 1,
        distance: 0,
        text: str[i],
      });
      i++;
    }
  }

  return encodedPairs;
};

const BinaryEncoding = () => {
  const [inputString, setInputString] = useState('');
  const [windowSize, setWindowSize] = useState(10);
  const [binaryOutput, setBinaryOutput] = useState('');
  const [encodedPairs, setEncodedPairs] = useState<
    { length: number; distance: number; text: string }[]
  >([]);
  const [selectedText, setSelectedText] = useState('');

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setInputString(value);
    setBinaryOutput(binaryRepresentation(value));
  };

  const handleWindowSizeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setWindowSize(Number(e.target.value));
  };

  const handleEncode = () => {
    const pairs = dictionaryEncoding(inputString, windowSize);
    setEncodedPairs(pairs);
  };

  const handlePairClick = (text: string) => {
    setSelectedText(text);
  };

  return (
    <div style={{ padding: '20px' }}>
      <div>
        <label>Input String: </label>
        <input type="text" value={inputString} onChange={handleInputChange} />
      </div>
      <div style={{ marginTop: '20px' }}>
        <label>Binary Representation: </label>
        <div
          style={{
            whiteSpace: 'pre-wrap',
            border: '1px solid black',
            padding: '10px',
          }}
        >
          {binaryOutput}
        </div>
      </div>
      <div style={{ marginTop: '20px' }}>
        <label>Sliding Window Size (bytes): </label>
        <input
          type="number"
          value={windowSize}
          onChange={handleWindowSizeChange}
        />
      </div>
      <div style={{ marginTop: '20px' }}>
        <button onClick={handleEncode}>Encode</button>
      </div>
      <div style={{ marginTop: '20px' }}>
        <label>Encoded Output: </label>
        <div
          style={{
            whiteSpace: 'pre-wrap',
            border: '1px solid black',
            padding: '10px',
          }}
        >
          {encodedPairs.map((pair, index) => (
            <span
              key={index}
              onClick={() => handlePairClick(pair.text)}
              style={{ cursor: 'pointer' }}
            >
              <span style={{ color: 'black' }}>{pair.length}</span>
              <span style={{ color: 'red' }}>({pair.distance}) </span>
            </span>
          ))}
        </div>
      </div>
      {selectedText && (
        <div style={{ marginTop: '20px' }}>
          <label>Referenced Text: </label>
          <div
            style={{
              whiteSpace: 'pre-wrap',
              border: '1px solid black',
              padding: '10px',
            }}
          >
            {selectedText}
          </div>
        </div>
      )}
    </div>
  );
};

export default BinaryEncoding;
