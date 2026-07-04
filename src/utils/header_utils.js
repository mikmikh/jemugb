import {
  HEADER_ADDRS,
  mapROMSizeKib,
  mapRAMSizeKib,
  mapDestinationCode,
  mapCartridgeType,
} from "../constants/header.js";
import { toChar } from "./bit_utils.js";

export function getHeaderInfo(data) {
  const title = parseTitle(data);
  // const header_checksum = calcHeaderCheckSum(data);
  // const global_checksum = calcGlobalCheckSum(data);
  const header_checksum = data[HEADER_ADDRS.HEADER_CHECKSUM];
  const global_checksum =
    (data[HEADER_ADDRS.R_GLOBAL_CHECKSUM[0]] << 8) |
    data[HEADER_ADDRS.R_GLOBAL_CHECKSUM[1]];
  const rom_size = mapROMSizeKib[data[HEADER_ADDRS.ROM_SIZE]];
  const ram_size = mapRAMSizeKib[data[HEADER_ADDRS.RAM_SIZE]];
  const destination_code =
    mapDestinationCode[data[HEADER_ADDRS.DESTINATION_CODE]];
  const cartridge_type = mapCartridgeType[data[HEADER_ADDRS.CARTRIDGE_TYPE]];

  const res = {
    title,
    header_checksum,
    global_checksum,
    // header_checksum_actual,
    // global_checksum_actual,
    rom_size,
    ram_size,
    destination_code,
    cartridge_type,
  };

  return res;
}

function calcHeaderCheckSum(data) {
  let res = 0x00;
  for (let i = 0x0134; i <= 0x014c; i++) {
    res = (res - data[i] - 1) & 0xff;
  }
  return res;
}
function calcGlobalCheckSum(data) {
  let res = 0x0000;
  for (let i = 0; i <= data.length; i++) {
    if (i == 0x014e || i == 0x014f) continue;
    res = (res + (data[i] & 0xff)) & 0xffff;
  }
  return res;
}
function parseTitle(data) {
  const res = [];
  for (var i = HEADER_ADDRS.R_TITLE[0]; i < HEADER_ADDRS.R_TITLE[1]; i++) {
    res.push(toChar(data[i]));
  }
  return res.join("");
}
