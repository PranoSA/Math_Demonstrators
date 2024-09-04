'use client';

import next from 'next';
import React, { useState } from 'react';

const colors = ['red', 'green', 'blue', 'orange', 'purple'];

const textToBinary = (text: string) => {
  return text
    .split('')
    .map((char) => char.charCodeAt(0).toString(2).padStart(16, '0'))
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
  const [highlightedBase64, setHighlightedBase64] = useState<number | null>(
    null
  );

  const [decodingMode, setDecodingMode] = useState<
    'ascii' | 'utf-16' | 'utf-32' | 'utf-8'
  >('utf-16');

  //Split into binary with text index information
  type TextInformation = {
    string_index: number; //index in string the input occured, so "🏈" will correspond to 4 of these but have the same string_index
    byte_value: number; //8 or 16 bit doesn't matter for now, that is part of the rendering proccess
    char_index: number; // index of actual intended character ignoring utf-16 stupidity
  };

  const textualInformationRef = React.useRef<TextInformation[]>([]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const text = e.target.value;
    setInputText(text);

    const binary = textToBinary(text);
    setBinaryOutput(binary);

    const base64 = binaryToBase64(binary);
    setBase64Output(base64);
  };

  const getColoredText = (text: string) => {
    //append 子元素到数组
    const binary_length_chracter = () => {};

    type char_info = {
      char_codes: number[];
      byte_length: number;
      char: string;
    };

    const char_information: char_info[] = []; //holds information about the original character, including if it is a surrogate pair

    const textInformation: TextInformation[] = []; //holds codepoint by codepoint information

    let length = text.length;
    let current_input_index = 0; // the character location ,so surrogate pairs will be counted as 1
    let current_codepoint_index = 0; //index in original string

    while (current_codepoint_index < length) {
      const first_char = text[current_codepoint_index]?.codePointAt(0);

      if (first_char === undefined) {
        break; //later render an error message
      }

      //check if ascii and if the char code is greater than 127
      if (decodingMode === 'ascii' && first_char > 127) {
        return (
          <div className="w-full flex flex-wrap">
            <div className="w-full">
              Error: ASCII mode does not support characters with a code point
              greater than 127
            </div>
          </div>
        );
      }

      if (decodingMode === 'ascii') {
        //naively just dump the char code into the char_information
        char_information.push({
          char_codes: [first_char],
          byte_length: 8,
          char: String.fromCodePoint(first_char),
        });

        textInformation.push({
          string_index: current_codepoint_index,
          byte_value: first_char,
          char_index: current_input_index,
        });
        current_codepoint_index++;
        current_input_index++;
      }

      if (decodingMode === 'utf-16') {
        //check if part of surrogate pair
        if (first_char >= 0xd800 && first_char <= 0xdbff) {
          const second_char = text[current_codepoint_index + 1]?.codePointAt(0);

          if (second_char === undefined) {
            break; //later render an error message
          }

          char_information.push({
            char_codes: [first_char, second_char],
            byte_length: 32,
            char: String.fromCodePoint(first_char, second_char),
          });

          // push 4 bytes for the surrogate pair
          // so it will be the first 8 bits, then the next 8 bits
          // then the next 8 bits, then the next 8 bits
          textInformation.push({
            string_index: current_codepoint_index,
            // then the first 8 bits of first_char
            byte_value: first_char >> 8,
            char_index: current_input_index,
          });

          textInformation.push({
            string_index: current_codepoint_index,
            // then the last 8 bits of first_char
            byte_value: first_char & 0xff,
            char_index: current_input_index,
          });

          textInformation.push({
            string_index: current_codepoint_index,
            // then the first 8 bits of second_char
            byte_value: second_char >> 8,
            char_index: current_input_index,
          });

          textInformation.push({
            string_index: current_codepoint_index,
            // then the last 8 bits of second_char
            byte_value: second_char & 0xff,
            char_index: current_input_index,
          });

          current_codepoint_index++;
        } else {
          char_information.push({
            char_codes: [first_char],
            byte_length: 32,
            char: String.fromCodePoint(first_char),
          });
          //utf-32 is always 4

          //add the 2 bytes to the text

          textInformation.push({
            string_index: current_codepoint_index,
            byte_value: first_char >> 8,
            char_index: current_input_index,
          });

          textInformation.push({
            string_index: current_codepoint_index,
            byte_value: first_char & 0xff,
            char_index: current_input_index,
          });
        }

        current_input_index++;
        current_codepoint_index++;
      }

      if (decodingMode === 'utf-32') {
        //test if first_char is a surrogate pair
        if (first_char >= 0xd800 && first_char <= 0xdbff) {
          const next_code_point =
            text[current_codepoint_index + 1]?.codePointAt(0) || 0xdc00;
          const value =
            (first_char - 0xd800) << (10 + next_code_point - 0xdc00 + 0x10000);

          //add the 4 bytes to the textInformation
          textInformation.push({
            string_index: current_codepoint_index,
            byte_value: value >> 24,
            char_index: current_input_index,
          });

          textInformation.push({
            string_index: current_codepoint_index,
            byte_value: (value >> 16) & 0xff,
            char_index: current_input_index,
          });

          textInformation.push({
            string_index: current_codepoint_index,
            byte_value: (value >> 8) & 0xff,
            char_index: current_input_index,
          });

          textInformation.push({
            string_index: current_codepoint_index,
            byte_value: value & 0xff,
            char_index: current_input_index,
          });

          char_information.push({
            char_codes: [first_char, next_code_point],
            byte_length: 32,
            char: String.fromCodePoint(first_char, next_code_point),
          });

          current_codepoint_index += 2;
          current_input_index++;
        } else {
          textInformation.push({
            string_index: current_codepoint_index,
            byte_value: 0,
            char_index: current_input_index,
          });

          textInformation.push({
            string_index: current_codepoint_index,
            byte_value: 0,
            char_index: current_input_index,
          });

          textInformation.push({
            string_index: current_codepoint_index,
            byte_value: (first_char >> 8) & 0xff,
            char_index: current_input_index,
          });

          textInformation.push({
            string_index: current_codepoint_index,
            byte_value: first_char & 0xff,
            char_index: current_input_index,
          });

          char_information.push({
            char_codes: [first_char],
            byte_length: 32,
            char: String.fromCodePoint(first_char),
          });
          current_codepoint_index++;
          current_input_index++;
        }
      }

      if (decodingMode === 'utf-8') {
        //go through the loop again,

        if (first_char <= 0x7f) {
          char_information.push({
            char_codes: [first_char],
            byte_length: 8,
            char: String.fromCodePoint(first_char),
          });

          textInformation.push({
            string_index: current_codepoint_index,
            byte_value: first_char,
            char_index: current_input_index,
          });
          current_codepoint_index++;
          current_input_index++;
          continue;
        }

        if (first_char >= 0xd800 && first_char <= 0xdbff) {
          let value = 0; //this is the U+ Value we want to get
          //left shift the value by 10 bits
          value += (first_char - 0xd800) << 10;
          const next_code_point =
            text[current_codepoint_index + 1].codePointAt(0) || 0;
          value += next_code_point - 0xdc00 + 0x10000;

          //now lets see how large it is utf-8 (1-4 bytes)
          // if its greater than 2^16 - 1, then its 4 bytes
          // if its greater than 2^11 - 1, then its 3 bytes
          // if its greater than 2^7 - 1, then its 2 bytes
          // else its 1 byte

          if (value >= 0x10000) {
            //4 byte UTF-8 character
            const byte_1 = 0b11110000 | (value >> 18);
            const byte_2 = 0b10000000 | ((value >> 12) & 0b00111111);
            const byte_3 = 0b10000000 | ((value >> 6) & 0b00111111);
            const byte_4 = 0b10000000 | (value & 0b00111111);

            //append to textInformation
            textInformation.push({
              string_index: current_codepoint_index,
              byte_value: byte_1,
              char_index: current_input_index,
            });

            textInformation.push({
              string_index: current_codepoint_index,
              byte_value: byte_2,
              char_index: current_input_index,
            });

            textInformation.push({
              string_index: current_codepoint_index,
              byte_value: byte_3,
              char_index: current_input_index,
            });

            textInformation.push({
              string_index: current_codepoint_index,
              byte_value: byte_4,
              char_index: current_input_index,
            });

            char_information.push({
              char_codes: [first_char, next_code_point],
              byte_length: 32,
              char: String.fromCodePoint(first_char, next_code_point),
            });
          }

          if (value >= 0x800 && value < 0x10000) {
            //3 byte UTF-8 character
            const byte_1 = 0b11100000 | (value >> 12);
            const byte_2 = 0b10000000 | ((value >> 6) & 0b00111111);
            const byte_3 = 0b10000000 | (value & 0b00111111);

            //append to textInformation
            textInformation.push({
              string_index: current_codepoint_index,
              byte_value: byte_1,
              char_index: current_input_index,
            });

            textInformation.push({
              string_index: current_codepoint_index,
              byte_value: byte_2,
              char_index: current_input_index,
            });

            textInformation.push({
              string_index: current_codepoint_index,
              byte_value: byte_3,
              char_index: current_input_index,
            });

            char_information.push({
              char_codes: [first_char, next_code_point],
              byte_length: 24,
              char: String.fromCodePoint(first_char, next_code_point),
            });
          }

          if (value >= 0x80 && value <= 0x7ff) {
            //2 byte UTF-8 character
            const byte_1 = 0b11000000 | (value >> 6);
            const byte_2 = 0b10000000 | (value & 0b00111111);

            //append to textInformation
            textInformation.push({
              string_index: current_codepoint_index,
              byte_value: byte_1,
              char_index: current_input_index,
            });

            textInformation.push({
              string_index: current_codepoint_index,
              byte_value: byte_2,
              char_index: current_input_index,
            });

            char_information.push({
              char_codes: [first_char, next_code_point],
              byte_length: 16,
              char: String.fromCodePoint(first_char, next_code_point),
            });
          }

          current_input_index++;
          current_codepoint_index += 2;
        } else {
          // this means that the value is between 0-2^16 - 1
          //which means it will fit in 2-3 bytes
          let value = first_char;
          if (value >= 0x800) {
            //3 byte UTF-8 character
            const byte_1 = 0b11100000 | (value >> 12);
            const byte_2 = 0b10000000 | ((value >> 6) & 0b00111111);
            const byte_3 = 0b10000000 | (value & 0b00111111);

            //append to textInformation
            textInformation.push({
              string_index: current_codepoint_index,
              byte_value: byte_1,
              char_index: current_input_index,
            });

            textInformation.push({
              string_index: current_codepoint_index,
              byte_value: byte_2,
              char_index: current_input_index,
            });

            textInformation.push({
              string_index: current_codepoint_index,
              byte_value: byte_3,
              char_index: current_input_index,
            });

            char_information.push({
              char_codes: [first_char],
              byte_length: 24,
              char: String.fromCodePoint(first_char),
            });
          }
          if (value >= 0x80 && value < 0x800) {
            //2 byte UTF-8 character
            const byte_1 = 0b11000000 | (value >> 6);
            const byte_2 = 0b10000000 | (value & 0b00111111);

            //append to textInformation
            textInformation.push({
              string_index: current_codepoint_index,
              byte_value: byte_1,
              char_index: current_input_index,
            });

            textInformation.push({
              string_index: current_codepoint_index,
              byte_value: byte_2,
              char_index: current_input_index,
            });

            char_information.push({
              char_codes: [first_char],
              byte_length: 16,
              char: String.fromCodePoint(first_char),
            });
          }
          current_input_index++;
          current_codepoint_index++;
        }
      }
    }

    textualInformationRef.current = textInformation;

    //now that you have char_information and textInformation, render the text
    // you will go on by 1, rendering the character padded by the number of bits - 1
    //then underneat render the binary text with the color corresponding to the character index
    // in the textInformation array
    let last_seen_string_index = -1;

    const text_elements = textInformation.map((char, index) => {
      const new_character = char.string_index !== last_seen_string_index;
      last_seen_string_index = char.string_index;

      const current_index_char: number = char.char_index;
      if (current_index_char === undefined) {
        alert('current_char is undefined');
      }
      // get current char based on the on the number of code_points
      const length_of_char =
        char_information[current_index_char].char_codes.length;

      // get the current char by selecting the length_of_char from the text
      const current_char = text.slice(
        last_seen_string_index,
        last_seen_string_index + length_of_char
      );

      return (
        <div className="w-1/3 md:w-1/6 flex flex-wrap flex-col" key={index}>
          {/* First Row is the character if its changed, appended by 7 hidden 0s, else 8 hidden 0s*/}
          {new_character ? (
            <div className="w-full flex flex-wrap">
              <span
                style={{
                  color: colors[current_index_char % colors.length],
                }}
              >
                {current_char.trim() === '' ? '\u200B' : current_char}
              </span>
              <span className="hidden">0000000</span>
            </div>
          ) : (
            <div className="w-full flex flex-wrap">
              <span>_</span>
              <span className="hidden">0000000</span>
            </div>
          )}
          {/* Second Row is the binary representation of the character */}
          <div className="w-full flex flex-wrap align-end">
            <span style={{ color: colors[current_index_char % colors.length] }}>
              {char.byte_value.toString(2).padStart(8, '0').slice(0, 8)}
            </span>
          </div>
        </div>
      );
    });

    return <div className="w-full flex flex-wrap">{text_elements}</div>;
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

  const getUnderlinedBinary = (binary2: string) => {
    const segments: string[] = [];

    //iterate over the textinformation array and get the char_index
    const text_information = textualInformationRef.current;

    //convert text_information to a binary string of 1s and 0s
    const binary = text_information
      .map((info) => info.byte_value.toString(2).padStart(8, '0'))
      .reduce((acc, val) => acc + val, '');

    for (let i = 0; i < binary.length; i += 6) {
      segments.push(binary.slice(i, i + 6).padEnd(6, '0'));
    }

    /* const segments = [];
    for (let i = 0; i < binary.length; i += 6) {
      segments.push(binary.slice(i, i + 6).padEnd(6, '0'));
    }*/
    const base64Chars =
      'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';

    return segments.map((segment, index) => (
      <div
        key={index}
        style={{
          display: 'inline-block',
          textAlign: 'center',
          margin: '0 5px',
        }}
        onClick={() => setHighlightedBase64(parseInt(segment, 2))}
      >
        <div>
          {segment.split('').map((bit, bitIndex) => (
            <span
              key={bitIndex}
              style={{
                color:
                  colors[
                    (textualInformationRef.current[
                      Math.floor((index * 6 + bitIndex) / 8)
                    ]?.char_index || 0) % colors.length
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

  const getBase64Characters = (binary2: string) => {
    const base64Chars =
      'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';
    const segments = [];

    const binary: string = textualInformationRef.current
      .map((info) => info.byte_value.toString(2).padStart(8, '0'))
      .reduce((acc, val) => acc + val, '');

    for (let i = 0; i < binary.length; i += 6) {
      const segment = binary.slice(i, i + 6).padEnd(6, '0');
      const index = parseInt(segment, 2);
      segments.push(base64Chars[index]);
    }

    return (
      <div className="w-full flex flex-wrap flex-row">
        <div className="w-full flex flex-wrap flex-row">
          {segments.map((char, index) => (
            <div
              key={index}
              className="w-1/4 md:w-1/6 flex-row flex-"
              onClick={() => {
                setHighlightedBase64(base64Chars.indexOf(char));
                console.log(
                  'New highlighted base64 character: ',
                  base64Chars.indexOf(char)
                );
              }}
            >
              {index + 1}. {char}
            </div>
          ))}
        </div>
        <div className="w-full flex flex-wrap flex-col mt-10">
          <h1> Final Base64 Characters</h1>
          <p>
            {/* Reduce segments to just the characters */}
            {segments.reduce((acc, val) => acc + val, '')}
          </p>
        </div>
      </div>
    );

    return segments.map((char, index) => (
      <div key={index} className="w-full flex flex-row flex-">
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
                  <td
                    style={{
                      backgroundColor:
                        index === highlightedBase64 ? 'yellow' : 'transparent',
                    }}
                  >
                    {index}
                  </td>
                  <td
                    style={{
                      backgroundColor:
                        index === highlightedBase64 ? 'yellow' : 'transparent',
                    }}
                  >
                    {char}
                  </td>
                </React.Fragment>
              );
            })}
          </tr>
        ))}
      </tbody>
    </table>
  );

  const handleDecodingModeChange = (
    e: React.ChangeEvent<HTMLSelectElement>
  ) => {
    setDecodingMode(e.target.value as 'ascii' | 'utf-16' | 'utf-32' | 'utf-8');
    //const binary = textToBinary(inputText);
    // setBinaryOutput(binary);
    //setInputText('');
    //const base64 = binaryToBase64(binary);
    //setBase64Output(base64);
  };

  return (
    <div className="p-20 flex flex-wrap flex-row">
      <div className="w-full flex flex-wrap flex-col">
        <label>Input Text: </label>
        <input type="text" value={inputText} onChange={handleInputChange} />
        <label>Decoding Mode: </label>
        <select
          value={decodingMode}
          onChange={(e) => handleDecodingModeChange(e)}
        >
          <option value="ascii">ASCII</option>
          <option value="utf-8">UTF-8</option>
          <option value="utf-16">UTF-16</option>
          <option value="utf-32">UTF-32</option>
        </select>
      </div>

      <div className="w-full md:w-1/2 flex flex-wrap">
        <div className="w-full flex flex-wrap">
          <label>Binary Breakdown </label>
          <div className="w-full flex flex-wrap">
            {getColoredText(inputText)}
          </div>
        </div>

        <div className="w-full flex-row  flex flex-wrap mt-10">
          <div className="w-full flex-col flex flex-wrap">
            <label>Underlined Binary Segments: </label>
          </div>
          <div>{getUnderlinedBinary(binaryOutput)}</div>
        </div>
        <div className="w-full flex-col flex flex-wrap mt-10">
          <label>Base64 Characters: </label>
          {getBase64Characters(binaryOutput)}
        </div>
      </div>
      <div className="w-full md:w-1/2 flex flex-wrap">{base64Table}</div>
    </div>
  );
};

export default Base64Demonstrator;
