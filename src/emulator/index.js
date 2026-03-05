import {
  RetroAppWrapper,
  ScriptAudioProcessor,
  DisplayLoop,
  LOG,
} from '@webrcade/app-common';

export class Emulator extends RetroAppWrapper {

  constructor(app, debug = false) {
    super(app, debug);

    // Allow game saves to persist after loading state
    this.saveManager.setDisableGameSaveOnStateLoad(false);

    this.lastFrequency = 60;
    this.frequency = 60;

    this.audioStarted = 0;

    // Fractional sample carry (for 800.25)
    this.audioCarry = 0;

    this.total = 0;
    this.count = 0;

    this.audioCallback = (offset, length) => {
      // length = incoming frames (mono)
      //this.total += length;
      this.count++;

      if (this.count === 60) {
        //console.log("total:", this.total);
        this.total = 0;
        this.count = 0;
      }

      // ---- target frames this callback ----
      const exactFrames = 48015 / 60; // 800.25
      const framesWithCarry = exactFrames + this.audioCarry;
      const outFrames = Math.floor(framesWithCarry);
      this.audioCarry = framesWithCarry - outFrames;

      // ---- input samples (stereo interleaved) ----
      const inSamples = length << 1;
      const input = new Int16Array(
        window.Module.HEAP16.buffer,
        offset,
        inSamples
      );

      // ---- output buffer (stereo interleaved) ----
      const outSamples = outFrames << 1;
      const output = new Int16Array(outSamples);

      // ---- frame walking resampler (no timing drift) ----
      const step = length / outFrames;

      let srcFrame = 0;
      for (let i = 0; i < outFrames; i++) {
        const si = (srcFrame | 0) << 1;

        output[i * 2]     = input[si];
        output[i * 2 + 1] = input[si + 1];

        srcFrame += step;
      }

      this.total += (outSamples >> 1);

      this.audioProcessor.storeSoundCombinedInput(
        output,
        2,
        outSamples,
        0,
        32768
      );
    };
  }

  GAME_SRAM_NAME = 'game.srm';
  SAVE_NAME = 'sav';

  createAudioProcessor() {
    return new ScriptAudioProcessor(
      2,
      48000,
      8192 + 4096,
      2048
    ).setDebug(this.debug);
  }

  onFrame() {
    if (this.audioStarted !== -1) {
      if (this.audioStarted > 1) {
        this.audioStarted = -1;
        // Start the audio processor
        this.audioProcessor.start();
      } else {
        this.audioStarted++;
      }
    }
  }

  createDisplayLoop(debug) {
    const loop = new DisplayLoop(
      this.frequency,
      true, // vsync
      debug, // debug
      false,
    );
    // loop.setAdjustTimestampEnabled(false);
    return loop;
  }

  getScriptUrl() {
    return 'js/mednafen_pce_fast_libretro.js';
  }

  getPrefs() {
    return this.prefs;
  }

  PCE_DEFAULT_HEADER = Uint8Array.from([
    0x48, 0x55, 0x42, 0x4D,
    0x00, 0x88, 0x10, 0x80,
    0x00, 0x00, 0x00, 0x00,
    0x00, 0x00, 0x00, 0x00,
  ]);

  isDefaultPceSram(data) {
    if (!data || data.length !== 2048) {
      return false;
    }

    // Check header
    for (let i = 0; i < this.PCE_DEFAULT_HEADER.length; i++) {
      if (data[i] !== this.PCE_DEFAULT_HEADER[i]) {
        return false;
      }
    }

    // Check rest is zero
    for (let i = this.PCE_DEFAULT_HEADER.length; i < data.length; i++) {
      if (data[i] !== 0x00) {
        return false;
      }
    }

    return true;
  }

  async saveState() {
    const { saveStatePath, started } = this;
    const { FS, Module } = window;

    try {
      if (!started) {
        return;
      }

      // Save to files
      Module._cmd_savefiles();

      let path = '';
      const files = [];
      let s = null;

      path = `/home/web_user/retroarch/userdata/saves/${this.GAME_SRAM_NAME}`;
      LOG.info('Checking: ' + path);
      try {
        s = FS.readFile(path);
        if (s) {
          LOG.info('Found save file: ' + path);
          if (!this.isDefaultPceSram(s)) {
            files.push({
              name: this.SAVE_NAME,
              content: s,
            });
          } else {
            LOG.info('PCE SRAM is default. Skipping write.');
          }
        }
      } catch (e) {}

      if (files.length > 0) {
        if (await this.getSaveManager().checkFilesChanged(files)) {
          await this.getSaveManager().save(
            saveStatePath,
            files,
            this.saveMessageCallback,
          );
        }
      } else {
        await this.getSaveManager().delete(path);
      }
    } catch (e) {
      LOG.error('Error persisting save state: ' + e);
    }
  }

  async loadState() {
    const { saveStatePath } = this;
    const { FS } = window;

    // Write the save state (if applicable)
    try {
      // Load
      const files = await this.getSaveManager().load(
        saveStatePath,
        this.loadMessageCallback,
      );

      if (files) {
        for (let i = 0; i < files.length; i++) {
          const f = files[i];
          if (f.name === this.SAVE_NAME) {
            LOG.info(`writing ${this.GAME_SRAM_NAME} file`);
            FS.writeFile(
              `/home/web_user/retroarch/userdata/saves/${this.GAME_SRAM_NAME}`,
              f.content,
            );
          }
        }

        // Cache the initial files
        await this.getSaveManager().checkFilesChanged(files);
      }
    } catch (e) {
      LOG.error('Error loading save state: ' + e);
    }
  }

  applyGameSettings() {
    const { Module } = window;
    const props = this.getProps();
    let options = 0;

    // b buttons
    if (props.pad6button) {
      LOG.info('## 6 button pad on');
      options |= this.OPT1;
    } else {
      LOG.info('## 6 button pad off');
    }

    // map RUN/SELECT
    if (props.mapRunSelect) {
      LOG.info('## Map run and select on');
      options |= this.OPT2;
    } else {
      LOG.info('## Map run and select off');
    }

    Module._wrc_set_options(options);
  }

  // resizeScreen(canvas) {
  //   // Determine the zoom level
  //   let zoomLevel = 0;
  //   if (this.getProps().zoomLevel) {
  //     zoomLevel = this.getProps().zoomLevel;
  //   }

  //   const wsize = 106 + zoomLevel;
  //   const hsize = 96 + zoomLevel;
  //   canvas.style.setProperty('width', `${wsize}vw`, 'important');
  //   canvas.style.setProperty('height', `${hsize}vh`, 'important');
  //   canvas.style.setProperty('max-width', `calc(${hsize}vh*1.333)`, 'important');
  //   canvas.style.setProperty('max-height', `calc(${wsize}vw*0.75)`, 'important');
  // }

  // getShotAspectRatio() { return 1.333; }

  isForceAspectRatio() {
    return false;
  }

  getDefaultAspectRatio() {
    return 1.333;
  }

  resizeScreen(canvas) {
    this.canvas = canvas;
    // // Determine the zoom level
    // let zoomLevel = 0;
    // if (this.getProps().zoomLevel) {
    //   zoomLevel = this.getProps().zoomLevel;
    // }

    // const size = 96 + zoomLevel;
    // canvas.style.setProperty('width', `${size}vw`, 'important');
    // canvas.style.setProperty('height', `${size}vh`, 'important');
    // canvas.style.setProperty('max-width', `calc(${size}vh*1.22)`, 'important');
    // canvas.style.setProperty('max-height', `calc(${size}vw*0.82)`, 'important');
    this.updateScreenSize();
  }

  getShotAspectRatio() { return this.getDefaultAspectRatio(); }
}
