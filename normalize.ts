export type InputArr = [
  number,
  number,
  number,
  number,
  number,
  number,
  number,
  number,
  number,
  number,
  number
]


const dpad_arr = ['n', 'ne', 'e', 'se', 's', 'sw', 'w', 'nw', 'center']

export enum Button {
  none= 0,
  R=2,
  L=4,
  Y=8,
  X=16,
  B=32,
  A=64
}

const norm_buttons = (buttons: number) => {

}

const normalize_inputs = (inputArr: InputArr) => {
  const [
    ,  //0
    dpad,   //1
    centers,//2
    buttons,//3
    lh,     //4
    lv,     //5
    rh,     //6
    rv,     //7
    ltrig,  //8
    rtrig,  //9
    k,      //10
  ] = inputArr
  const output = {
    dpad: dpad_arr[dpad],

  }
}

