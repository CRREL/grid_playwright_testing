import { Cookie } from '@playwright/test';
import fs from 'fs';
import path from 'path';

export const updateCookies = (cookies: Cookie[]) => {
  const fileName = path.resolve(__dirname, '../.auth/cookies.json');
  const newObj = {
    "cookies": cookies,
    "origins": []
  }
  if (fs.existsSync(fileName)) {
    fs.writeFile(fileName, JSON.stringify(newObj), (err) => {
      if (err) {
        console.error(`Error updating cookies: ${err}`);
      }
    });
  } else {
    console.log("Cookies file not found.");
  }
}