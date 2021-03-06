// user of field.
import {
    Map,
} from 'immutable';
import Field, {
    State,
    ICoeff,
    makeState,
    getDir,
    getPos,
} from './field';
import {
    Complex,
    cadd,
    cmul,
    csmul,
    czero,
    cone,
    ci,
} from './complex';
import {
    positionalDistribution,
    showPositionalDistribution,
} from './util';

declare var require : (path:string)=>any;

const fs = require('fs');
const path = require('path');
const appRootPath = require('app-root-path');

// 結果を出力するところ
const OUTPATH = path.join(appRootPath.toString(), 'data.txt');

// 次元
const MAXN = 8;

// 結果出力先ファイルをオープン
const filestream = fs.createWriteStream(OUTPATH, {
    flags: 'w',
    defaultEncoding: 'utf8',
});

// 各次元ごとに計測する
for(let N = 1; N <= MAXN; N++){
    console.log(`===== ${N} =====`);
    // サンプル数
    const iter = Math.max(16, 0.5*Math.floor(N**2));

    // ステップ数
    const STEPS = 180;

    // Fieldを初期化
    const director = (d: Map<State, Complex>, t: number)=>{
        const result = Map<State, Complex>().asMutable();

        // 量子ゆらぎの定数
        const gt0 = t / STEPS;
        const gt1 = 1 - gt0;
        // const gt = 100 * ((t+1) ** (-1.5)) - 0.1;   // t = 99 で0になる！

        // 方向
        for(let a=0; a<N; a++){
            // 位置
            for(let v=0, n=2**N; v<n; v++){
                // ===== H0
                // Sを適用する前の位置
                const vb = v ^ (1 << a);
                // vbの確率はGrover's diffusion operatorをかけて求める
                let s = czero;
                for(let b=0; b<N; b++){
                    const dd = a===b ? 2/N-1 : 2/N;
                    s = cadd(s, csmul(dd, d.get(makeState(b, vb), czero)));
                }
                s = csmul(gt0, s);

                // ===== H1
                let s2 = czero;
                for(let w=0; w<n; w++){
                    const dd = v===w ? 2/n-1 : 2/n;
                    s2 = cadd(s2, csmul(dd, d.get(makeState(a, w), czero)));
                }
                s = cadd(s, cmul(csmul(gt1, ci), s2));
                result.set(makeState(a, v), s);
            }
        }
        return result.asImmutable();
    };
    const f = new Field(director);

    // 初期状態
    const coeff = Map<State, Complex>().set(makeState(0, 0), cone) as ICoeff;

    let cnt = 0;
    let steps = 0;
    for(let i=0; i<iter; i++){
        console.log(i);
        // absorbing vertexはランダムにset
        // const m = Math.floor(Math.random() * (2**N));
        // antipodalな位置
        const m = (2**N) - 1;

        f.init(coeff);
        // step数
        const s = f.test(m, STEPS);

        if(s >= 0){
            cnt++;
            steps += s;
        }
    }
    // absorbing vertexに到達する確率
    const p = cnt / iter;
    // absorbing time
    const time = steps / cnt / p;

    filestream.write(`${N} ${cnt} ${p} ${time}\n`);
    console.log(N, p, time);
}

filestream.end();
console.log('end', new Date());
