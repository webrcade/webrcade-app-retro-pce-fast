import React from "react";

import {
  FetchAppData,
  WebrcadeRetroApp
} from '@webrcade/app-common';

import { Emulator } from './emulator';
import { EmulatorPauseScreen } from './pause';

import './App.scss';

class App extends WebrcadeRetroApp {
  createEmulator(app, isDebug) {
    return new Emulator(app, isDebug);
  }

  getBiosMap() {
    return {
      '38179df8f4ac870017db21ebcbf53114': 'syscard3.pce',
      // '08e36edbea28a017f79f8d4f7ff9b6d7': 'pcfx.rom',
    };
  }

  async fetchBios(bios, biosMap = null, alternateBiosMap = null) {
    if (this.customBios) {
      const biosUrl = bios[0];
      const fad = new FetchAppData(biosUrl);
      const res = await fad.fetch();
      const blob = await res.blob();
      const biosBuffers = {};
      biosBuffers['syscard3.pce'] = new Uint8Array(await blob.arrayBuffer());
      return biosBuffers;
    }
    return super.fetchBios(bios, biosMap, alternateBiosMap);
  }

  getBiosUrls(appProps) {
    if (appProps.customBios && appProps.customBios.trim().length > 0) {
      this.customBios = true;
      return appProps.customBios.trim();
    }
    return appProps.pcecd_bios;
  }

  renderPauseScreen() {
    const { appProps, emulator } = this;

    return (
      <EmulatorPauseScreen
        emulator={emulator}
        appProps={appProps}
        closeCallback={() => this.resume()}
        exitCallback={() => {
          this.exitFromPause();
        }}
        isEditor={this.isEditor}
        isStandalone={this.isStandalone}
      />
    );
  }
}

export default App;
