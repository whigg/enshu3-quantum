// user of field.
import {
    Map,
} from 'immutable';
import Field, {
    State,
    ICoeff,
    makeState,
} from './field';
import {
    Complex,
    cadd,
    csmul,
    czero,
    cone,
} from './complex';
import {
    positionalDistribution,
    showPositionalDistribution,
} from './util';

declare var require : (path:string)=>any;

const fs = require('fs');

// 結果を出力するところ
const OUTPATH = './data.txt';

//Hadamard operatorを左からかける（係数無視）
const director = (d: Map<number, Complex>)=>{
    const dl = d.get(0, czero);
    const dr = d.get(1, czero);
    return Map<number, Complex>()
           .set(0, cadd(dl, dr))
           .set(1, cadd(dl, csmul(-1, dr)));
}
const transition = (a:number, v:number)=>{
    // vをa方向に動かす(a: 0=L, 1=R)
    return v - 1 + 2*a;
};

// 結果出力先ファイルをオープン
const filestream = fs.createWriteStream(OUTPATH, {
    flags: 'w',
    defaultEncoding: 'utf8',
});

const f = new Field(director, transition);

// 初期状態
const coeff = Map<State, Complex>().set(makeState(1, 0), cone) as ICoeff;


// absorbing vertexが-20から20くらいまで
const ms = [-20, -16, -12, -8, -4, -3, -2, -1, 1, 2, 3, 4, 5, 8, 12, 16, 20];
for(let m of ms){
    console.log(`===== ${m} =====`);

    // 繰り返し回数
    const iter = 1000;
    // 確率を求める
    let cnt = 0;
    for(let i=0; i<iter; i++){
        if(i%50===0){
            console.log(i);
        }
        f.init(coeff);
        if(f.test(m, 80) >= 0){
            cnt++;
        }
    }
    // 確率
    const p = cnt / iter;
    filestream.write(`${m} ${p}\n`);
    console.log('%d: %d', m, p);
}
filestream.end();
console.log('end', new Date());
