import React from 'react';
import { Component } from 'react';
import { PceSettingsEditor } from './settings';

import { Pce2GamepadControls, Pce2KeyboardControls, Pce6GamepadControls, Pce6KeyboardControls } from './controls';

import {
  CustomPauseScreen,
  EditorScreen,
  GamepadWhiteImage,
  KeyboardWhiteImage,
  PauseScreenButton,
  Resources,
  SettingsAppWhiteImage,
  TEXT_IDS,
} from '@webrcade/app-common';

export class EmulatorPauseScreen extends Component {
  constructor() {
    super();
    this.state = {
      mode: this.ModeEnum.PAUSE,
    };
  }

  ModeEnum = {
    PAUSE: 'pause',
    CONTROLS: 'controls',
    PCE_SETTINGS: 'pce-settings',
  };

  ADDITIONAL_BUTTON_REFS = [React.createRef(), React.createRef()];

  render() {
    const { ADDITIONAL_BUTTON_REFS, ModeEnum } = this;
    const {
      appProps,
      closeCallback,
      emulator,
      exitCallback,
      isEditor,
      isStandalone,
    } = this.props;
    const { mode } = this.state;


    const emProps = emulator.getProps();

    const gamepad = emProps.pad6button ? <Pce6GamepadControls /> : <Pce2GamepadControls mapRunSelect={emProps.mapRunSelect} />;
    const keyboard = emProps.pad6button ? <Pce6KeyboardControls /> : <Pce2KeyboardControls mapRunSelect={emProps.mapRunSelect} />;
    const gamepadLabel = Resources.getText(
      TEXT_IDS.GAMEPAD_CONTROLS_DETAIL,
      Resources.getText(emProps.pad6button ? TEXT_IDS.SIX_BUTTON : TEXT_IDS.TWO_BUTTON),
    );
    const keyboardLabel = Resources.getText(
      TEXT_IDS.KEYBOARD_CONTROLS_DETAIL,
      Resources.getText(emProps.pad6button ? TEXT_IDS.SIX_BUTTON : TEXT_IDS.TWO_BUTTON),
    );

    return (
      <>
        {mode === ModeEnum.PAUSE ? (
          <CustomPauseScreen
            appProps={appProps}
            closeCallback={closeCallback}
            exitCallback={exitCallback}
            isEditor={isEditor}
            isStandalone={isStandalone}
            additionalButtonRefs={ADDITIONAL_BUTTON_REFS}
            additionalButtons={[
              <PauseScreenButton
                imgSrc={GamepadWhiteImage}
                buttonRef={ADDITIONAL_BUTTON_REFS[0]}
                label={Resources.getText(TEXT_IDS.VIEW_CONTROLS)}
                onHandlePad={(focusGrid, e) =>
                  focusGrid.moveFocus(e.type, ADDITIONAL_BUTTON_REFS[0])
                }
                onClick={() => {
                  this.setState({ mode: ModeEnum.CONTROLS });
                }}
              />,
              <PauseScreenButton
                imgSrc={SettingsAppWhiteImage}
                buttonRef={ADDITIONAL_BUTTON_REFS[1]}
                label="PC Engine Settings"
                onHandlePad={(focusGrid, e) =>
                  focusGrid.moveFocus(e.type, ADDITIONAL_BUTTON_REFS[1])
                }
                onClick={() => {
                  this.setState({ mode: ModeEnum.PCE_SETTINGS });
                }}
              />,
            ]}
          />
        ) : null}
        {mode === ModeEnum.CONTROLS ? (
          <EditorScreen
            onClose={closeCallback}
            tabs={[
              {
                image: GamepadWhiteImage,
                label: gamepadLabel,
                content: gamepad,
              },
              {
                image: KeyboardWhiteImage,
                label: keyboardLabel,
                content: keyboard,
              },
            ]}
          />
        ) : null}
        {mode === ModeEnum.PCE_SETTINGS ? (
          <PceSettingsEditor
            emulator={emulator}
            onClose={closeCallback}
          />
        ) : null}
      </>
    );
  }
}
