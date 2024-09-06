'use client';

import next from 'next';
import React, { useEffect, useState } from 'react';

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

const convertBase64ToNumberByChar = (char: string) => {
  const base64Chars =
    'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';
  return base64Chars.indexOf(char);
};

// create a binary string from utf-16 string
const createBinaryStringFromBase64 = (base64: string) => {
  let binary_string = '';
  for (let i = 0; i < base64.length; i++) {
    const index = convertBase64ToNumberByChar(base64[i]);
    binary_string += index.toString(2).padStart(6, '0');
  }
  console.log('binary_string', binary_string);
  console.log('Length of binary_string', binary_string.length);
  return binary_string;
  //add 0s so the length is a multiple of 8
  //return binary_string.padEnd(Math.ceil(binary_string.length / 8) * 8, '0');
};

const convert_utf_value_to_utf_16 = (utf_value: number) => {
  //if value is over 2^16 - 1, then it is a surrogate pair
  try {
    //return a string from this function ressembling a char
    if (utf_value <= 0xffff) {
      return String.fromCodePoint(utf_value);
    }

    //if its a surrogate pair
    //then we need to convert it to a surrogate pair
    // so we will subtract 0x10000 from the value
    if (utf_value > 0xffff) {
      const high_surrogate = 0xd800 + ((utf_value - 0x10000) >> 10);
      const low_surrogate = 0xdc00 + (utf_value & 0x3ff);
      const char = String.fromCodePoint(high_surrogate, low_surrogate);
      return char;
    }
  } catch {
    return '';
  }
};

//for utf-16 its simple, just use built in atob and btoa
const convertInputStringToUtf16 = (binary: string) => {
  //convert the string to binary
  const actual_binary = createBinaryStringFromBase64(binary);

  let chars = '';

  let current_string_index = 0;

  while (current_string_index < actual_binary.length - 15) {
    //get the next 16 bits
    const current_byte = actual_binary.slice(
      current_string_index,
      current_string_index + 16
    );

    //if greater than 2^16 - 1, its incorrect
    if (current_byte.length !== 16) {
      //alert('Error: Invalid UTF-16 Byte');
    }

    let value = parseInt(current_byte, 2);

    if (value > 0xffff) {
      //alert('Error: Invalid UTF-16 Byte');
    }
    //check if part of surrogate pair, or do I not have to?

    chars += convert_utf_value_to_utf_16(value);

    //jump forward 16 bits
    current_string_index += 16;
  }

  return chars;
};

const convertASCIIByteToChar = (binary: string) => {
  let current_string_index = 0;
  let chars = '';
  while (current_string_index < binary.length - 7) {
    //get the next 8 bits
    const current_byte = binary.slice(
      current_string_index,
      current_string_index + 8
    );

    console.log('current_byte', current_byte);

    //if greater than 2^8 - 1, its incorrect
    if (current_byte.length !== 8) {
      //alert('Error: Invalid ASCII Byte');
      //pad end with 0s
      current_byte.padEnd(8, '0');
      console.log('Why Are You Here??');
    }

    let value = parseInt(current_byte, 2);

    if (value > 0xff) {
      alert('Error: Invalid ASCII Byte');
    }

    chars += String.fromCharCode(value);

    //jump forward 8 bits
    current_string_index += 8;
  }

  //apend one last character if there is 8 bits left
  /*if (current_string_index < binary.length) {
    const current_byte = binary.slice(
      current_string_index,
      current_string_index + 8
    );
    let value = parseInt(current_byte, 2);
    chars += String.fromCharCode(value);
  }*/
  return chars;
};

//utf-32 is simple, just convert the binary to a number and then use convert_utf_value_to_utf_16
const convertBinaryUTF32ByteToChar = (binary: string) => {
  let current_string_index = 0;
  let chars = '';
  while (current_string_index < binary.length - 7) {
    //get the next 32 bits
    const current_byte = binary.slice(
      current_string_index,
      current_string_index + 32
    );

    //if greater than 2^20 + 2^16, its incorrect
    if (current_byte.length !== 32) {
      alert('Error: Invalid UTF-32 Byte');
    }

    let value = parseInt(current_byte, 2);

    if (value > 0x10ffff) {
      alert('Error: Invalid UTF-32 Byte');
    }

    chars += convert_utf_value_to_utf_16(value);

    //jump forward 32 bits
    current_string_index += 32;
  }

  return chars;
};

//utf-8 is the worst
const convertBinaryUTF8ByteToChar = (binary: string) => {
  let current_string_index = 0;
  const current_char_index = 0;
  let chars = '';

  while (current_string_index < binary.length - 7) {
    //get the length in bytes of the current charater by counting numbers of 1s in the first byte
    // if 0, then the length is 1
    // if 110, then the length is 2
    // if 1110, then the length is 3
    // if 11110, then the length is 4

    let length = 0;
    let current_byte = binary.slice(
      current_string_index,
      current_string_index + 8
    );
    console.log('current_byte', current_byte);

    //count the number of 1s in the first byte
    while (current_byte[length] === '1') {
      length++;
    }
    if (length === 0) {
      length = 1;
      let value = parseInt(current_byte, 2);
      chars += String.fromCharCode(value);
      current_string_index += 8;
      console.log('chars', chars);
    }

    //get the next bytes
    if (length === 2) {
      let value = parseInt(current_byte, 2) & 0b00011111;
      current_byte = binary.slice(
        current_string_index + 8,
        current_string_index + 16
      );
      value = (value << 6) | (parseInt(current_byte, 2) & 0b00111111);
      chars += String.fromCharCode(value);
      current_string_index += 16;
    }
    if (length === 3) {
      let value = parseInt(current_byte, 2) & 0b00001111;
      current_byte = binary.slice(
        current_string_index + 8,
        current_string_index + 16
      );
      value = (value << 6) | (parseInt(current_byte, 2) & 0b00111111);
      current_byte = binary.slice(
        current_string_index + 16,
        current_string_index + 24
      );
      value = (value << 6) | (parseInt(current_byte, 2) & 0b00111111);
      chars += convert_utf_value_to_utf_16(value);
      current_string_index += 24;
    }
    if (length === 4) {
      //turn first 4 bits to 0
      let value = parseInt(current_byte, 2) & 0b00001111;

      current_byte = binary.slice(
        current_string_index + 8,
        current_string_index + 16
      );
      value = (value << 6) | (parseInt(current_byte, 2) & 0b00111111);
      current_byte = binary.slice(
        current_string_index + 16,
        current_string_index + 24
      );
      value = (value << 6) | (parseInt(current_byte, 2) & 0b00111111);
      current_byte = binary.slice(
        current_string_index + 24,
        current_string_index + 32
      );
      value = (value << 6) | (parseInt(current_byte, 2) & 0b00111111);
      chars += convert_utf_value_to_utf_16(value);
      current_string_index += 32;
      console.log('value in hex', value.toString(16));
    }
    if (length > 4) {
      alert('Error: Invalid UTF-8 Byte');
    }
  }

  //chgeck if current string index is passd the length of the binary string
  //if it is , invalid chracter sequence
  if (current_string_index > binary.length) {
    return '';
    // alert('Error: Invalid UTF-8 Byte');
  }

  //if there are remaining bits, imply the value
  //of the character
  console.log('Remaining bits', binary.slice(current_string_index));
  //do not pad this value
  let value = parseInt(binary.slice(current_string_index), 2);
  //chars += String.fromCharCode(value);

  return chars;
};

const Base64Demonstrator = () => {
  const [inputText, setInputText] = useState('');
  const [binaryOutput, setBinaryOutput] = useState('');
  const [base64Output, setBase64Output] = useState('');
  const [highlightedBase64, setHighlightedBase64] = useState<number | null>(
    null
  );
  const [encodedText, setEncodedText] = useState('');
  const [encodingOrDecoding, setEncodingOrDecoding] = useState<
    'encoding' | 'decoding'
  >('encoding');

  const [decodingMode, setDecodingMode] = useState<
    'ascii' | 'utf-16' | 'utf-32' | 'utf-8'
  >('utf-16');

  const [extraEncodingBits, setExtraEncodingBits] = useState<string>('');
  const encodedTextRef = React.useRef<string>('');

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
          <span
            style={{
              color: 'black',
              margin: '1px',
              border: '2px solid black',
            }}
          >
            {' '}
            00
          </span>
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
          {parseInt(segment, 2)}
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

    encodedTextRef.current =
      segments.reduce((acc, val) => acc + val, '') + paddingEquals();

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
        {encodingOrDecoding === 'encoding' && (
          <div className="w-full flex flex-wrap flex-col mt-10">
            <h1> Final Base64 Characters</h1>
            <p>
              {/* Reduce segments to just the characters */}
              {segments.reduce((acc, val) => acc + val, '') + paddingEquals()}
            </p>
          </div>
        )}
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

  const handleEncodedTextChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setEncodedText(e.target.value);
  };

  useEffect(() => {
    //deal with trailing equals
    const trailing_equals = encodedText.match(/=+$/);
    const actual_encoding_text = encodedText.replace(/=+$/, '');

    const binary = createBinaryStringFromBase64(actual_encoding_text);
    //set extra encoding bits to the leftover after the last byte, so mod 8 length
    const last_index = Math.floor(binary.length / 8) * 8;

    const encoding_bits = binary.slice(last_index, binary.length);
    //for each =, subtract 2 bits
    let extra_bits = 0;
    if (trailing_equals) {
      extra_bits = trailing_equals[0].length * 2;
    }
    encodedTextRef.current = actual_encoding_text;
    setExtraEncodingBits(encoding_bits.slice(extra_bits, encoding_bits.length));

    //setExtraEncodingBits(binary.slice(last_index, binary.length));

    if (decodingMode === 'utf-16') {
      setInputText(convertInputStringToUtf16(actual_encoding_text));
      //directly set it using atob
      //setInputText(convertInputStringToUtf16(e.target.value));
      /* try {
        const decodedString = atob(e.target.value);
        setInputText(decodedString);
      } catch {
        setInputText('');
      }
        */
    }
    if (decodingMode === 'ascii') {
      //create binary first
      const binary = createBinaryStringFromBase64(actual_encoding_text);
      //then pass it to the function
      setInputText(convertASCIIByteToChar(binary));
    }
    if (decodingMode === 'utf-32') {
      //create binary first
      const binary = createBinaryStringFromBase64(actual_encoding_text);
      //then pass it to the function
      setInputText(convertBinaryUTF32ByteToChar(binary));
    }
    if (decodingMode === 'utf-8') {
      //create binary first
      const binary = createBinaryStringFromBase64(actual_encoding_text);
      //then pass it to the function
      setInputText(convertBinaryUTF8ByteToChar(binary));
    }
  }, [encodedText]);

  const handleSetDecodingMode = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setEncodingOrDecoding(e.target.value as 'encoding' | 'decoding');
    if (e.target.value === 'decoding') {
      //call
      const new_encoded_text = getBase64Characters(binaryOutput);
      setEncodedText(encodedTextRef.current);
    }
  };

  const paddingEquals = () => {
    const padding_length = inputText.length % 3;
    return '='.repeat(padding_length);
  };

  return (
    <div className="p-20 flex flex-wrap flex-row">
      <div className="w-full flex flex-wrap flex-col">
        <label>Mode: </label>
        <select
          value={encodingOrDecoding}
          onChange={(e) => handleSetDecodingMode(e)}
        >
          <option value="encoding">Encoding</option>
          <option value="decoding">Decoding</option>
        </select>
      </div>
      {encodingOrDecoding === 'encoding' ? (
        <div className="w-full md:w-1/2 flex flex-wrap flex-col">
          <label>Input Text: </label>
          <input type="text" value={inputText} onChange={handleInputChange} />
          <label>Text Encoding: </label>
          <select
            value={decodingMode}
            onChange={(e) => handleDecodingModeChange(e)}
          >
            <option value="ascii">ASCII</option>
            <option value="utf-8">UTF-8 (ASCII Compatible)</option>
            <option value="utf-16">UTF-16</option>
            <option value="utf-32">UTF-32</option>
          </select>
          <div className="w-full flex flex-wrap">
            <div className="w-full flex flex-wrap mt-10">
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
              <p> {getBase64Characters(binaryOutput)}</p>
            </div>
          </div>
        </div>
      ) : (
        <div className="w-full md:w-1/2 flex flex-wrap flex-col">
          <label>Encoded Text: </label>
          <input
            type="text"
            value={encodedText}
            onChange={handleEncodedTextChange}
          />
          <label>Text Encoding: </label>
          <select
            value={decodingMode}
            onChange={(e) => handleDecodingModeChange(e)}
          >
            <option value="ascii">ASCII</option>
            <option value="utf-8">UTF-8 (ASCII Compatible)</option>
            <option value="utf-16">UTF-16</option>
            <option value="utf-32">UTF-32</option>
          </select>

          <div className="w-full  flex flex-wrap">
            <div className="w-full flex-col flex flex-wrap mt-10">
              <label>Base64 Characters: </label>
              {getBase64Characters(binaryOutput)}
            </div>
            <div className="w-full flex-row  flex flex-wrap mt-10">
              <div className="w-full flex-col flex flex-wrap">
                <label>Underlined Binary Segments: </label>
              </div>
              <div>{getUnderlinedBinary(binaryOutput)}</div>
            </div>
            <div className="w-full flex flex-wrap mt-10">
              <label>Binary Breakdown </label>
              <div className="w-full flex flex-wrap">
                {getColoredText(inputText)}
              </div>
            </div>
            <div className="w-full flex flex-wrap flex-col mt-10">
              {/* show the inputText, not as an input */}
              <h1> Output Final Characters</h1>
              <p>
                {inputText
                  .replace(/\u0000/g, '\\u0000')
                  .replace(/ /g, '\u00A0')}
              </p>
            </div>
            {/* Extra Encoding Bits */}
            <div className="w-full flex flex-wrap mt-10">
              <div className="w-full flex flex-wrap">
                <label>Extra Encoding Bits: </label>
              </div>
              <div className="w-full flex flex-wrap">
                {' '}
                <p> {extraEncodingBits} </p>
              </div>
            </div>
          </div>
        </div>
      )}
      <div className="w-full md:w-1/2 flex flex-wrap">{base64Table}</div>
    </div>
  );
};

export default Base64Demonstrator;
