import React from 'react';
import {Composition} from 'remotion';
import {Overlay} from './Overlay';
import {Props, DikeyProps} from './types';
import {Dikey} from './Dikey';
import {Grafik, GProps} from './Grafik';
import {Reel} from './Reel';
import {ReelProps} from './reelTypes';
import {Sztori, SztoriCompProps} from './sztori/Sztori';
import {sztorik} from './sztorik';

const sztoriDemo: SztoriCompProps = {
  slug: Object.keys(sztorik)[0] ?? '', width: 1080, height: 1920, fps: 30, duration: 10, bg: '#0E1726', felirat: 'karaoke',
  safe: {fent: 290, lent: 450, oldal: 80},
  theme: {primary: '#3DD6C6', secondary: '#1E2A3D', accent: '#FFB547', szoveg: '#FFFFFF', halvany: '#B8C2D3', font: 'Inter Display'},
  szavak: []
};

const reelDemo: ReelProps = {
  width: 1080, height: 1920, fps: 30, duration: 9, bg: '#0E1726', hatter: 'racs',
  theme: {primary: '#3DD6C6', secondary: '#1E2A3D', accent: '#FFB547', szoveg: '#FFFFFF', halvany: '#B8C2D3', style: 'blok', font: 'Inter Display'},
  events: [
    {type: 'kinetik', start: 0, dur: 3.2, hook: true, kiemel: ['negyven'], szavak: [{w: 'Reggel', t: 0.1}, {w: 'nyolc.', t: 0.5}, {w: 'Negyven', t: 1.1}, {w: 'olvasatlan', t: 1.5}, {w: 'e-mail.', t: 2.0}]},
    {type: 'szamlalo', start: 2.9, dur: 3.2, ertek: 40, cimke: 'olvasatlan e-mail', atmenet: true},
    {type: 'cta', start: 5.8, dur: 3.2, szoveg: 'Kövess a további tippekért', gomb: 'Követés'}
  ]
};

const grafikDemo: GProps = {
  width: 1080, height: 1920, fps: 30, duration: 12,
  theme: {primary: '#1bbdc0', secondary: '#000000', accent: '#ffffff', style: 'terminal'},
  faceShow: [[0, 5]], faceIntro: 'yp-face-intro.mp4', faceCta: 'yp-face-cta.mp4',
  adimBas: [1, 4, 7, 10],
  events: []
};

const demo: Props = {
  width: 1920, height: 1080, fps: 30, duration: 12,
  theme: {primary: '#ffffff', secondary: '#16181d', accent: '#ff5c5c', style: 'cam'},
  events: [
    {type: 'search', start: 0.5, dur: 3, query: 'yapay zeka ile video edit'},
    {type: 'counter', start: 4, dur: 3, to: 3000, suffix: ' abone', label: '15 videoda'},
    {type: 'text', start: 8, dur: 3, text: 'Dikkat: kişisel bilgi', tone: 'uyari', pos: 'alt'}
  ]
};

const dikeyDemo: DikeyProps = {
  ...demo, width: 1080, height: 1920, duration: 6,
  video: 'ornek.mp4', srcW: 1920, srcH: 1080,
  face: {x: 80, y: 62, w: 18, h: 34}, faceShow: [[0, 2]],
  kadraj: [{t: 0, cx: 50, cy: 50, w: 100}, {t: 3, cx: 35, cy: 40, w: 45}],
  events: []
};

export const Root: React.FC = () => (
  <>
  <Composition
    id="Overlay"
    component={Overlay}
    width={demo.width}
    height={demo.height}
    fps={demo.fps}
    durationInFrames={demo.duration * demo.fps}
    defaultProps={demo}
    calculateMetadata={({props}) => ({
      width: props.width, height: props.height, fps: props.fps,
      durationInFrames: Math.max(1, Math.round(props.duration * props.fps))
    })}
  />
  <Composition
    id="Dikey"
    component={Dikey}
    width={1080}
    height={1920}
    fps={dikeyDemo.fps}
    durationInFrames={dikeyDemo.duration * dikeyDemo.fps}
    defaultProps={dikeyDemo}
    calculateMetadata={({props}) => ({
      width: 1080, height: 1920, fps: props.fps,
      durationInFrames: Math.max(1, Math.round(props.duration * props.fps))
    })}
  />
  <Composition
    id="Grafik"
    component={Grafik}
    width={1080}
    height={1920}
    fps={grafikDemo.fps}
    durationInFrames={grafikDemo.duration * grafikDemo.fps}
    defaultProps={grafikDemo}
    calculateMetadata={({props}) => ({
      width: 1080, height: 1920, fps: props.fps,
      durationInFrames: Math.max(1, Math.round(props.duration * props.fps))
    })}
  />
  <Composition
    id="Sztori"
    component={Sztori}
    width={1080}
    height={1920}
    fps={30}
    durationInFrames={300}
    defaultProps={sztoriDemo}
    calculateMetadata={({props}) => ({
      width: props.width, height: props.height, fps: props.fps,
      durationInFrames: Math.max(1, Math.round(props.duration * props.fps))
    })}
  />
  <Composition
    id="Reel"
    component={Reel}
    width={1080}
    height={1920}
    fps={reelDemo.fps}
    durationInFrames={reelDemo.duration * reelDemo.fps}
    defaultProps={reelDemo}
    calculateMetadata={({props}) => ({
      width: props.width, height: props.height, fps: props.fps,
      durationInFrames: Math.max(1, Math.round(props.duration * props.fps))
    })}
  />
  </>
);
