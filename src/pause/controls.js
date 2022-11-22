import { ControlsTab } from '@webrcade/app-common';

export class Pce2GamepadControls extends ControlsTab {
  render() {
    const { mapRunSelect } = this.props;

    return (
      <>
        {[
          this.renderControl('start', 'Run'),
          this.renderControl('select', 'Select'),
          this.renderControl('dpad', 'Move'),
          this.renderControl('lanalog', 'Move'),
          this.renderControl('b', 'I'),
          mapRunSelect ? this.renderControl('x', 'Run') : this.renderControl('x', 'I'),
          this.renderControl('a', 'II'),
          mapRunSelect ? this.renderControl('y', 'Select') : this.renderControl('y', 'II'),
        ]}
      </>
    );
  }
}

export class Pce2KeyboardControls extends ControlsTab {
  render() {
    const { mapRunSelect } = this.props;
    
    return (
      <>
        {[
          this.renderKey('Enter', 'Run'),
          this.renderKey('ShiftRight', 'Select'),
          this.renderKey('ArrowUp', 'Up'),
          this.renderKey('ArrowDown', 'Down'),
          this.renderKey('ArrowLeft', 'Left'),
          this.renderKey('ArrowRight', 'Right'),
          this.renderKey('KeyX', 'I'),
          mapRunSelect ? this.renderKey('KeyA', 'Run') : this.renderKey('KeyA', 'I'),
          this.renderKey('KeyZ', 'II'),
          mapRunSelect ? this.renderKey('KeyA', 'Select') : this.renderKey('KeyS', 'II'),
        ]}
      </>
    );
  }
}

export class Pce6GamepadControls extends ControlsTab {
  render() {
    return (
      <>
        {[
          this.renderControl('start', 'Run'),
          this.renderControl('select', 'Select'),
          this.renderControl('dpad', 'Move'),
          this.renderControl('lanalog', 'Move'),
          this.renderControl('b', 'I'),
          this.renderControl('a', 'II'),
          this.renderControl('y', 'IV'),
          this.renderControl('x', 'III'),
          this.renderControl('lbump', 'V'),
          this.renderControl('rbump', 'VI'),
        ]}
      </>
    );
  }
}

export class Pce6KeyboardControls extends ControlsTab {
  render() {
    return (
      <>
        {[
          this.renderKey('Enter', 'Run'),
          this.renderKey('ShiftRight', 'Select'),
          this.renderKey('ArrowUp', 'Up'),
          this.renderKey('ArrowDown', 'Down'),
          this.renderKey('ArrowLeft', 'Left'),
          this.renderKey('ArrowRight', 'Right'),
          this.renderKey('KeyX', 'I'),
          this.renderKey('KeyZ', 'II'),
          this.renderKey('KeyS', 'IV'),
          this.renderKey('KeyA', 'III'),
          this.renderKey('KeyQ', 'V'),
          this.renderKey('KeyW', 'VI'),
        ]}
      </>
    );
  }
}
