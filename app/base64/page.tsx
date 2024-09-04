'use client';

import React, { useState } from 'react';

const colors = ['red', 'green', 'blue', 'orange', 'purple'];

const textToBinary = (text: string) => {
  return text
    .split('')
    .map((char) => char.charCodeAt(0).toString(2).padStart(8, '0'))
    .join('');
};

const binaryToBase64 = (binary: string) => {
  const base64Chars =
    'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';
  let base64 = '';
  for (let i = 0; i < binary.length; i += 6) {
    const segment = binary.slice(i, i + 6).padEnd(6, '0');
    const index = parseInt(segment, 2);
    base64 += base64Chars[index];
  }
  return base64;
};

const getBitLength = (char: string) => {
  const codePoint = char.codePointAt(0);
  if (codePoint !== undefined) {
    if (codePoint <= 0x7f) return 8; // 1 byte
    if (codePoint <= 0xffff) return 16; // 2 bytes
    if (codePoint <= 0x10ffff) return 32; // 4 bytes
  }
  return 8; // Default to 8 bits for safety
};

const Base64Demonstrator = () => {
  const [inputText, setInputText] = useState('');
  const [binaryOutput, setBinaryOutput] = useState('');
  const [base64Output, setBase64Output] = useState('');

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const text = e.target.value;
    setInputText(text);

    const binary = textToBinary(text);
    setBinaryOutput(binary);

    const base64 = binaryToBase64(binary);
    setBase64Output(base64);
  };

  const getColoredText = (text: string) => {
    return text.split('').map((char, index) => {
      const bitLength = getBitLength(char);
      return (
        <div className="w-1/3 md:w-1/6 flex flex-wrap flex-col" key={index}>
          <div className="w-full">
            <span key={index} style={{ color: colors[index % colors.length] }}>
              {char}
              <span style={{ visibility: 'hidden' }}>
                {'0'.repeat(bitLength - 2)}
              </span>
            </span>
          </div>
          {/* Now Binary Breakdown */}
          <div className="w-full">
            {char
              .charCodeAt(0)
              .toString(2)
              .padStart(bitLength, '0')
              .split('')
              .map((bit, bitIndex) => (
                <span
                  key={bitIndex}
                  style={{
                    color:
                      colors[
                        Math.floor((index * 8 + bitIndex) / 8) % colors.length
                      ],
                  }}
                >
                  {bit}
                </span>
              ))}
          </div>
        </div>
      );
    });
  };

  const getColoredBinary = (binary: string) => {
    return binary.split('').map((bit, index) => (
      <span
        key={index}
        style={{ color: colors[Math.floor(index / 8) % colors.length] }}
      >
        {bit}
      </span>
    ));
  };

  const getUnderlinedBinary = (binary: string) => {
    const segments = [];
    for (let i = 0; i < binary.length; i += 6) {
      segments.push(binary.slice(i, i + 6).padEnd(6, '0'));
    }
    return segments.map((segment, index) => (
      <div
        key={index}
        style={{
          display: 'inline-block',
          textAlign: 'center',
          margin: '0 5px',
        }}
      >
        <div>
          {segment.split('').map((bit, bitIndex) => (
            <span
              key={bitIndex}
              style={{
                color:
                  colors[
                    Math.floor((index * 6 + bitIndex) / 8) % colors.length
                  ],
              }}
            >
              {bit}
            </span>
          ))}
        </div>
        <div
          style={{
            borderTop: '1px solid black',
            borderLeft: '1px solid black',
            borderRight: '1px solid black',
            borderBottom: 'none',
            padding: '0 2px',
            marginTop: '-2px',
          }}
        >
          {index + 1}[{parseInt(segment, 2)}]
        </div>
      </div>
    ));
  };

  const getBase64Characters = (binary: string) => {
    const base64Chars =
      'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';
    const segments = [];
    for (let i = 0; i < binary.length; i += 6) {
      const segment = binary.slice(i, i + 6).padEnd(6, '0');
      const index = parseInt(segment, 2);
      segments.push(base64Chars[index]);
    }
    return segments.map((char, index) => (
      <div key={index}>
        {index + 1}. {char}
      </div>
    ));
  };

  const base64Table = (
    <table
      className="border-1 p-5 ml-20"
      cellPadding="5"
      style={{ marginLeft: '20px' }}
    >
      <thead>
        <tr>
          <th>Index</th>
          <th>Character</th>
          <th>Index</th>
          <th>Character</th>
          <th>Index</th>
          <th>Character</th>
          <th>Index</th>
          <th>Character</th>
        </tr>
      </thead>
      <tbody>
        {Array.from({ length: 16 }).map((_, rowIndex) => (
          <tr key={rowIndex}>
            {Array.from({ length: 4 }).map((_, colIndex) => {
              const index = rowIndex + colIndex * 16;
              const char =
                'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/'.charAt(
                  index
                );
              return (
                <React.Fragment key={index}>
                  <td>{index}</td>
                  <td>{char}</td>
                </React.Fragment>
              );
            })}
          </tr>
        ))}
      </tbody>
    </table>
  );

  return (
    <div className="p-20 flex flex-wrap flex-row">
      <div className="w-full flex flex--wrap flex-col">
        <label>Input Text: </label>
        <input type="text" value={inputText} onChange={handleInputChange} />
      </div>
      <div className="w-full md:w-1/2 flex flex-wrap">
        <div className="w-full flex flex-wrap">
          <label>Binary Breakdown </label>
          <div className="w-full flex flex-wrap">
            {getColoredText(inputText)}
          </div>
        </div>
        <div className="w-full flex flex-wrap">
          <label>Binary Representation: </label>
          <div className="w-full flex flex-wrap">
            {getColoredBinary(binaryOutput)}
          </div>
        </div>
        <div style={{ marginTop: '20px' }}>
          <label>Underlined Binary Segments: </label>
          <div>{getUnderlinedBinary(binaryOutput)}</div>
        </div>
        <div>
          <label>Base64 Characters: </label>
          {getBase64Characters(binaryOutput)}
        </div>
      </div>
      <div className="w-full md:w-1/2 flex flex-wrap">{base64Table}</div>

      <div style={{ marginTop: '20px' }}>
        <label>Final Base64 Output: </label>
        <div>{base64Output}</div>
      </div>
    </div>
  );
};

export default Base64Demonstrator;
