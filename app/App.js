import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  Image,
  StyleSheet,
  Dimensions,
  TouchableWithoutFeedback,
  TouchableOpacity,
  Animated,
  Easing,
  Platform,
  StatusBar,
  ScrollView,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { RULES, createCourse, nextPlatform, platformY, gravityFactor, bounceVelocity, sweepPlatform } from './src/course';
import { WorldScene, WORLD_ART } from './src/WorldScene';
import { DeepSpace, MeteorField } from './src/DeepSpace';
import { createMeteor, meteorPosition, meteorHitsPlayer } from './src/meteors';
import { loadProgress, saveProgress, requestPersistentStorage } from './src/storage';

const { width: SCREEN_W, height: SCREEN_H } = Dimensions.get('window');
const COMPACT = SCREEN_H < 700;

const MASCOTS = [
  require('./assets/mascots/blob-purple.png'),
  require('./assets/mascots/triangle-pink.png'),
  require('./assets/mascots/egg-orange.png'),
  require('./assets/mascots/square-blue.png'),
  require('./assets/mascots/drop-mint.png'),
  require('./assets/mascots/diamond-skyblue.png'),
  require('./assets/mascots/blob-yellow.png'),
  require('./assets/mascots/star-red.png'),
  require('./assets/mascots/egg-green.png'),
  require('./assets/mascots/heart-peach.png'),
  require('./assets/mascots/cloud-lilac.png'),
  require('./assets/mascots/pentagon-cyan.png'),
  require('./assets/mascots/drop-lime.png'),
  require('./assets/mascots/hex-peach.png'),
];

const MASCOT_NAMES = [
  'Blob viola', 'Triangolo rosa', 'Uovo arancione', 'Cubo blu',
  'Goccia menta', 'Diamante celeste', 'Blob giallo', 'Stella rossa',
  'Uovo verde', 'Cuore pesca', 'Nuvola lilla', 'Pentagono ciano',
  'Goccia lime', 'Esagono pesca',
];

const WORLDS = [
  {
    id: 'nebulosa', title: 'Nebulosa', subtitle: 'dei rimbalzi.', chapter: 'CAPITOLO 1',
    status: 'Inizia qui. Impara a invertire la gravita.',
    challenge: 'Supera le piattaforme e raccogli le mascotte.',
    detail: 'Piattaforme larghe, velocita dolce.',
    unlockScore: 0,
    scrollSpeed: 2.65, scrollIncrement: 0.0002,
    gapMin: 100, gapMax: 170, platMinW: 90, platMaxW: 160,
    gravity: 0.5, bounceVel: -9, collectChance: 0.35,
    menuBg: ['#eef0fc', '#e5ddf1'],
    accent: '#9676cb', accentDark: '#7853bd',
    accentGradient: ['#a286df', '#7853bd'],
    buttonShadow: '#6948a0',
    textColor: '#343352', secondaryText: '#817394',
    eyebrowColor: '#8d7fa5', accentEmphasis: '#9269d9',
    cardBg: 'rgba(255,255,255,0.5)', cardBorder: 'rgba(255,255,255,0.6)',
    dotActive: '#9275bc', dotInactive: '#c6bbd1',
    gameBg: ['#0f0c29', '#1a1a3e', '#24243e'],
  },
  {
    id: 'asteroidi', title: 'Asteroidi', subtitle: 'vaganti.', chapter: 'CAPITOLO 2',
    status: 'Le piattaforme si restringono.',
    challenge: 'Riflessi pronti, salti precisi.',
    detail: 'Piattaforme strette, velocita crescente.',
    unlockScore: 40,
    scrollSpeed: 3.0, scrollIncrement: 0.0003,
    gapMin: 115, gapMax: 195, platMinW: 75, platMaxW: 140,
    gravity: 0.55, bounceVel: -9.5, collectChance: 0.3,
    menuBg: ['#faf5e8', '#f5e6d0'],
    accent: '#b8893c', accentDark: '#a07a3a',
    accentGradient: ['#d4a654', '#a07a3a'],
    buttonShadow: '#8a6930',
    textColor: '#3d3020', secondaryText: '#8a7a5f',
    eyebrowColor: '#a09070', accentEmphasis: '#c89b54',
    cardBg: 'rgba(255,255,255,0.55)', cardBorder: 'rgba(255,255,255,0.7)',
    dotActive: '#b8893c', dotInactive: '#d4c4a0',
    gameBg: ['#1a1209', '#2a1f0e', '#3e3018'],
  },
  {
    id: 'buconero', title: 'Buco nero', subtitle: 'gravitazionale.', chapter: 'CAPITOLO 3',
    status: 'La gravita e piu forte qui dentro.',
    challenge: 'Ogni rimbalzo conta. Non cadere nel vuoto.',
    detail: 'Gravita intensa, spazi ridotti.',
    unlockScore: 60,
    scrollSpeed: 3.3, scrollIncrement: 0.0004,
    gapMin: 125, gapMax: 210, platMinW: 65, platMaxW: 125,
    gravity: 0.65, bounceVel: -10, collectChance: 0.25,
    menuBg: ['#eaf5f3', '#d8ede8'],
    accent: '#3d8b7a', accentDark: '#2a6b5c',
    accentGradient: ['#5aad98', '#2a6b5c'],
    buttonShadow: '#1f5447',
    textColor: '#1e3a34', secondaryText: '#5a7e74',
    eyebrowColor: '#6a9a8e', accentEmphasis: '#3d8b7a',
    cardBg: 'rgba(255,255,255,0.5)', cardBorder: 'rgba(255,255,255,0.6)',
    dotActive: '#3d8b7a', dotInactive: '#a8ccc2',
    gameBg: ['#040f0c', '#0a1f1a', '#123029'],
  },
  {
    id: 'supernova', title: 'Supernova', subtitle: 'infuocata.', chapter: 'CAPITOLO 4',
    status: 'Tutto brucia. Tutto accelera.',
    challenge: 'Velocita massima. Solo i migliori sopravvivono.',
    detail: 'Velocita folle, piattaforme minuscole.',
    unlockScore: 80,
    scrollSpeed: 3.8, scrollIncrement: 0.0005,
    gapMin: 135, gapMax: 220, platMinW: 55, platMaxW: 110,
    gravity: 0.7, bounceVel: -10.5, collectChance: 0.2,
    menuBg: ['#fceeee', '#f5d8d0'],
    accent: '#c25f5f', accentDark: '#9e3f3f',
    accentGradient: ['#e07070', '#9e3f3f'],
    buttonShadow: '#7a2e2e',
    textColor: '#3a1e1e', secondaryText: '#8a5f5f',
    eyebrowColor: '#a07070', accentEmphasis: '#c25f5f',
    cardBg: 'rgba(255,255,255,0.5)', cardBorder: 'rgba(255,255,255,0.65)',
    dotActive: '#c25f5f', dotInactive: '#d4a8a8',
    gameBg: ['#1a0909', '#2e1010', '#3e1818'],
  },
];

const PLAYER_SIZE = 64;
const PLATFORM_H = 16;
const COLLECTIBLE_SIZE = 40;
const TRAIL_LENGTH = 5;
const GROUND_Y = SCREEN_H - 100;
const CEILING_Y = 60;

const PLATFORM_COLORS = [
  { bg: '#6C5CE7', border: '#A29BFE', glow: 'rgba(108,92,231,0.3)' },
  { bg: '#E84393', border: '#FD79A8', glow: 'rgba(232,67,147,0.3)' },
  { bg: '#00B894', border: '#55EFC4', glow: 'rgba(0,184,148,0.3)' },
  { bg: '#0984E3', border: '#74B9FF', glow: 'rgba(9,132,227,0.3)' },
  { bg: '#FDCB6E', border: '#FFEAA7', glow: 'rgba(253,203,110,0.3)' },
];

function randomBetween(a, b) { return a + Math.random() * (b - a); }

function isWorldUnlocked(idx, scores) {
  if (idx === 0) return true;
  const prev = WORLDS[idx - 1];
  return (scores[prev.id] || 0) >= WORLDS[idx].unlockScore;
}

function getTotalScore(scores) {
  return Object.values(scores).reduce((s, v) => s + v, 0);
}

function getBestScore(scores) {
  return Math.max(0, ...Object.values(scores));
}

function getWorldsCompleted(scores) {
  return WORLDS.filter((w, i) => {
    if (i < WORLDS.length - 1) return (scores[w.id] || 0) >= WORLDS[i + 1].unlockScore;
    return (scores[w.id] || 0) > 0;
  }).length;
}

// ── Menu decorations ──

function MenuDecorations({ world, prominent = false }) {
  return <View style={StyleSheet.absoluteFill} pointerEvents="none">
    <Image source={WORLD_ART[world.id]} style={[StyleSheet.absoluteFill, { opacity: prominent ? .48 : .3 }]} resizeMode="cover" />
    <LinearGradient colors={prominent
      ? [world.menuBg[0]+'99', world.menuBg[0]+'20', world.menuBg[1]+'dd']
      : [world.menuBg[0]+'aa', world.menuBg[0]+'30', world.menuBg[1]+'ee']} locations={[0,.45,1]} style={StyleSheet.absoluteFill} />
  </View>;
}

// ── Game background: starfield ──

function Starfield() {
  const stars = useMemo(() =>
    Array.from({ length: 50 }, () => ({
      x: Math.random() * SCREEN_W, y: Math.random() * SCREEN_H,
      size: 1 + Math.random() * 2.5, opacity: 0.15 + Math.random() * 0.5,
      id: Math.random(),
    })), []);
  const twinkle = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.loop(Animated.sequence([
      Animated.timing(twinkle, { toValue: 1, duration: 2500, useNativeDriver: true }),
      Animated.timing(twinkle, { toValue: 0, duration: 2500, useNativeDriver: true }),
    ])).start();
  }, []);
  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      {stars.map((s) => (
        <Animated.View key={s.id} style={{
          position: 'absolute', left: s.x, top: s.y,
          width: s.size, height: s.size, borderRadius: s.size,
          backgroundColor: '#fff',
          opacity: twinkle.interpolate({ inputRange: [0, 1], outputRange: [s.opacity * 0.4, s.opacity] }),
        }} />
      ))}
    </View>
  );
}

// ── Game background: parallax blobs ──

function FloatingBlobs({ scrollOffset }) {
  const blobs = useMemo(() =>
    Array.from({ length: 6 }, () => ({
      mascotIdx: Math.floor(Math.random() * MASCOTS.length),
      x: Math.random() * SCREEN_W, y: randomBetween(80, SCREEN_H - 80),
      size: 20 + Math.random() * 35, opacity: 0.04 + Math.random() * 0.06,
      speed: 0.3 + Math.random() * 0.5, id: Math.random(),
    })), []);
  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      {blobs.map((b) => (
        <Image key={b.id} source={MASCOTS[b.mascotIdx]} style={{
          position: 'absolute',
          left: ((b.x - scrollOffset * b.speed) % (SCREEN_W + b.size * 2)) - b.size,
          top: b.y, width: b.size, height: b.size,
          opacity: b.opacity, resizeMode: 'contain',
        }} />
      ))}
    </View>
  );
}

// ── Player trail ──

function PlayerTrail({ positions, gravityDown, mascotSource }) {
  return (
    <>
      {positions.map((pos, i) => {
        const opacity = ((i + 1) / positions.length) * 0.25;
        const scale = 0.5 + ((i + 1) / positions.length) * 0.4;
        return (
          <Image key={i} source={mascotSource} style={{
            position: 'absolute',
            left: pos.x - (PLAYER_SIZE * scale) / 2 + PLAYER_SIZE / 2,
            top: pos.y - (PLAYER_SIZE * scale) / 2 + PLAYER_SIZE / 2,
            width: PLAYER_SIZE * scale, height: PLAYER_SIZE * scale,
            opacity, resizeMode: 'contain',
            transform: [{ rotate: gravityDown ? '0deg' : '180deg' }],
          }} />
        );
      })}
    </>
  );
}

// ── Particle burst ──

function CollectBurst({ x, y, onDone }) {
  const anim = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.timing(anim, {
      toValue: 1, duration: 500,
      easing: Easing.out(Easing.cubic), useNativeDriver: true,
    }).start(onDone);
  }, []);
  const particles = useRef(
    Array.from({ length: 8 }, () => ({
      angle: Math.random() * Math.PI * 2,
      dist: 35 + Math.random() * 40,
      size: 5 + Math.random() * 6,
      color: ['#FF6B9D', '#7C5CFC', '#FFB347', '#4ECDC4', '#FF6B6B', '#45B7D1', '#A29BFE', '#55EFC4'][
        Math.floor(Math.random() * 8)
      ],
    }))
  ).current;
  return (
    <>
      {particles.map((p, i) => (
        <Animated.View key={i} style={{
          position: 'absolute',
          left: x + COLLECTIBLE_SIZE / 2, top: y + COLLECTIBLE_SIZE / 2,
          width: p.size, height: p.size, borderRadius: p.size,
          backgroundColor: p.color,
          opacity: anim.interpolate({ inputRange: [0, 0.7, 1], outputRange: [1, 0.8, 0] }),
          transform: [
            { translateX: anim.interpolate({ inputRange: [0, 1], outputRange: [0, Math.cos(p.angle) * p.dist] }) },
            { translateY: anim.interpolate({ inputRange: [0, 1], outputRange: [0, Math.sin(p.angle) * p.dist] }) },
            { scale: anim.interpolate({ inputRange: [0, 0.3, 1], outputRange: [0.3, 1.8, 0] }) },
          ],
        }} />
      ))}
      <Animated.View style={{
        position: 'absolute',
        left: x + COLLECTIBLE_SIZE / 2 - 20, top: y + COLLECTIBLE_SIZE / 2 - 20,
        width: 40, height: 40, borderRadius: 20, backgroundColor: '#fff',
        opacity: anim.interpolate({ inputRange: [0, 0.3, 1], outputRange: [0.8, 0.3, 0] }),
        transform: [{ scale: anim.interpolate({ inputRange: [0, 1], outputRange: [0.5, 2.5] }) }],
      }} />
    </>
  );
}

// ── Gravity indicator ──

function GravityIndicator({ down }) {
  const rotation = useRef(new Animated.Value(down ? 0 : 1)).current;
  useEffect(() => {
    Animated.spring(rotation, { toValue: down ? 0 : 1, useNativeDriver: true, friction: 5 }).start();
  }, [down]);
  return (
    <View style={gs.gravityPill}>
      <Animated.View style={{ transform: [{ rotate: rotation.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '180deg'] }) }] }}>
        <View style={gs.arrowShaft} />
        <View style={gs.arrowHead} />
      </Animated.View>
    </View>
  );
}

// ── Flip flash ──

function FlipFlash({ trigger }) {
  const opacity = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    if (trigger === 0) return;
    opacity.setValue(0.2);
    Animated.timing(opacity, { toValue: 0, duration: 250, easing: Easing.out(Easing.quad), useNativeDriver: true }).start();
  }, [trigger]);
  return <Animated.View pointerEvents="none" style={[StyleSheet.absoluteFill, { backgroundColor: '#A29BFE', opacity }]} />;
}

// ── Score pop ──

function ScorePop({ value }) {
  const scale = useRef(new Animated.Value(1)).current;
  useEffect(() => {
    scale.setValue(1.3);
    Animated.spring(scale, { toValue: 1, useNativeDriver: true, friction: 4 }).start();
  }, [value]);
  return <Animated.Text style={[gs.scoreValue, { transform: [{ scale }] }]}>{value}</Animated.Text>;
}

// ── Collectible blob ──

function CollectibleBlob({ source, left, top }) {
  const bob = useRef(new Animated.Value(0)).current;
  const glow = useRef(new Animated.Value(0.3)).current;
  useEffect(() => {
    Animated.loop(Animated.sequence([
      Animated.timing(bob, { toValue: -6, duration: 800, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
      Animated.timing(bob, { toValue: 6, duration: 800, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
    ])).start();
    Animated.loop(Animated.sequence([
      Animated.timing(glow, { toValue: 0.7, duration: 1000, useNativeDriver: true }),
      Animated.timing(glow, { toValue: 0.3, duration: 1000, useNativeDriver: true }),
    ])).start();
  }, []);
  return (
    <Animated.View style={{ position: 'absolute', left, top, transform: [{ translateY: bob }] }}>
      <Animated.View style={{
        position: 'absolute', left: -6, top: -6,
        width: COLLECTIBLE_SIZE + 12, height: COLLECTIBLE_SIZE + 12,
        borderRadius: COLLECTIBLE_SIZE, backgroundColor: 'rgba(255,255,255,0.1)', opacity: glow,
      }} />
      <Image source={source} style={{ width: COLLECTIBLE_SIZE, height: COLLECTIBLE_SIZE, resizeMode: 'contain' }} />
    </Animated.View>
  );
}

// ── Platform ──

function PlatformBlock({ x, y, w, colorIdx, type, hitAt, onSweep, asteroidWorld }) {
  const special = {
    moving: { bg: '#a47a39', border: '#f7d79d', glow: '#b8893c40' },
    sweep: { bg: '#bc526c', border: '#ffb7ce', glow: '#bc526c40' },
    soft: { bg: '#e1eef6', border: '#ffffff', glow: '#c0d9ee30' },
    boost: { bg: '#358b70', border: '#a5ffcf', glow: '#358b7040' },
  };
  const c = special[type] || PLATFORM_COLORS[colorIdx] || PLATFORM_COLORS[0];
  return (
    <>
      <View style={{
        position: 'absolute', left: x + 4, top: y + PLATFORM_H + 2,
        width: w - 8, height: 8, borderRadius: 6, backgroundColor: c.glow,
      }} />
      <View style={{
        position: 'absolute', left: x, top: y, width: w, height: PLATFORM_H,
        borderRadius: type === 'crumble' ? 4 : PLATFORM_H / 2, backgroundColor: hitAt != null ? '#ff926a' : c.bg,
        borderWidth: 1, borderColor: c.border, overflow: 'hidden',
      }}>
        <View style={{
          position: 'absolute', top: 0, left: 8, right: 8,
          height: 4, borderRadius: 2, backgroundColor: 'rgba(255,255,255,0.55)',
        }} />
        {!asteroidWorld && (!type || type === 'normal' || type === 'crumble') && <Text style={{ color: '#fff', fontSize: 11, textAlign: 'center', lineHeight: 14 }}>{type === 'crumble' ? '⋯ ⋯ ⋯' : '· · ·'}</Text>}
      </View>
      {type === 'soft' && (
        <View pointerEvents="none" style={{ position:'absolute', left:x, top:y-12, width:w, height:28 }}>
          {[.15,.38,.62,.82].map((fraction,i) => <View key={i} style={{ position:'absolute', left:w*fraction-14, top:i%2 ? 0 : 5, width:28, height:24, borderRadius:18, backgroundColor:i%2 ? '#f5fbff' : '#e1eef6' }} />)}
          <View style={{ position:'absolute', left:3, right:3, bottom:0, height:15, borderRadius:12, backgroundColor:'#e1eef6' }} />
        </View>
      )}
      {type === 'moving' && (
        <View pointerEvents="none" style={{ position:'absolute', left:x+8, top:y+6, width:w-16, flexDirection:'row', justifyContent:'space-between' }}>
          {[0,1,2].map(i => <View key={i} style={{ width:5, height:5, borderRadius:3, backgroundColor:'#f9e2bb', borderWidth:1, borderColor:'#5b462d' }} />)}
        </View>
      )}
      {type === 'sweep' && (
        <View pointerEvents="none" style={{ position:'absolute', left:x, top:y, width:w, height:PLATFORM_H, flexDirection:'row', justifyContent:'space-evenly' }}>
          {[0,1,2,3].map(i => <View key={i} style={{ width:2, height:PLATFORM_H, backgroundColor:'#582936', transform:[{rotate:i%2 ? '-22deg' : '22deg'}] }} />)}
        </View>
      )}
      {type === 'boost' && (
        <View pointerEvents="none" style={{ position:'absolute', left:x+10, top:y+PLATFORM_H, width:w-20, flexDirection:'row', justifyContent:'space-around' }}>
          {[0,1,2].map(i => <View key={i} style={{ width:14, height:14 }}>
            {[0,1,2].map(j => <View key={j} style={{ position:'absolute', top:j*4, width:14, height:5, borderWidth:1.5, borderColor:'#b4f5d1', borderRadius:5 }} />)}
          </View>)}
        </View>
      )}
      {type === 'sweep' && (
        <TouchableOpacity accessibilityRole="button" accessibilityLabel="Spazza via la piattaforma"
          onPress={event => { event.stopPropagation(); onSweep(); }}
          style={{ position: 'absolute', left: x, top: y - 14, width: w, height: 44 }} />
      )}
    </>
  );
}

// ── Start screen (Ride the Wave style) ──

function StartScreen({
  world, selectedWorldIdx, selectedMascot, worldScores,
  onStart, onPrevWorld, onNextWorld, onDotPress,
  onCharacters, onProfile, locked,
}) {
  const floatAnim = useRef(new Animated.Value(0)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.loop(Animated.sequence([
      Animated.timing(floatAnim, { toValue: -14, duration: 1500, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
      Animated.timing(floatAnim, { toValue: 14, duration: 1500, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
    ])).start();
    Animated.loop(Animated.sequence([
      Animated.timing(pulseAnim, { toValue: 1.04, duration: 1100, useNativeDriver: true }),
      Animated.timing(pulseAnim, { toValue: 1, duration: 1100, useNativeDriver: true }),
    ])).start();
  }, []);

  const totalScore = getTotalScore(worldScores);
  const worldHigh = worldScores[world.id] || 0;

  return (
    <View style={{ flex: 1 }}>
      <LinearGradient colors={world.menuBg} style={StyleSheet.absoluteFill} />
      <MenuDecorations accent={world.accent} world={world} prominent />

      {/* Profile button */}
      <View style={ms.profileButtonWrapper}>
        <TouchableOpacity onPress={onProfile} style={[ms.profileButton, { borderColor: world.cardBorder, backgroundColor: world.cardBg }]} activeOpacity={0.7}>
          <View>
            <Text style={[ms.profileLabel, { color: world.eyebrowColor }]}>IL TUO PROFILO</Text>
            <Text style={[ms.profileScore, { color: world.textColor }]}>{totalScore} punti</Text>
          </View>
        </TouchableOpacity>
      </View>

      {/* Menu layout */}
      <View style={ms.menuLayout}>
        {/* Top: chapter + title */}
        <View style={ms.menuTop}>
          <Text style={[ms.eyebrow, { color: world.eyebrowColor }]}>{world.chapter}</Text>
          <Text style={[ms.title, { color: world.textColor }]}>
            {world.title}{'\n'}
            <Text style={{ color: world.accentEmphasis }}>{world.subtitle}</Text>
          </Text>
        </View>

        {/* Center: floating mascot */}
        <Animated.View style={[ms.mascotArea, { transform: [{ translateY: floatAnim }] }]}>
          <View style={[ms.mascotGlow, { backgroundColor: world.accent }]} />
          <Image source={MASCOTS[selectedMascot]} style={ms.mascotImage} />
        </Animated.View>

        {/* Bottom: nav + instructions + buttons */}
        <View style={ms.menuBottom}>
          {/* World navigation */}
          <View style={ms.worldNav}>
            <TouchableOpacity
              onPress={onPrevWorld}
              disabled={selectedWorldIdx === 0}
              style={[ms.worldArrow, { borderColor: world.cardBorder, backgroundColor: world.cardBg }]}
              activeOpacity={0.6}
            >
              <Text style={[ms.worldArrowText, { color: world.accent, opacity: selectedWorldIdx === 0 ? 0.2 : 1 }]}>{'‹'}</Text>
            </TouchableOpacity>

            <View style={{ alignItems: 'center' }}>
              <View style={ms.worldDots}>
                {WORLDS.map((_, i) => {
                  const unlocked = isWorldUnlocked(i, worldScores);
                  return (
                    <TouchableOpacity key={i} onPress={() => onDotPress(i)} style={{ padding: 8 }}>
                      <View style={[
                        ms.dot,
                        {
                          backgroundColor: unlocked
                            ? (i === selectedWorldIdx ? world.dotActive : world.dotInactive)
                            : '#d0d0d0',
                          width: i === selectedWorldIdx ? 24 : 7,
                        },
                      ]} />
                    </TouchableOpacity>
                  );
                })}
              </View>
              <Text style={[ms.swipeLabel, { color: world.eyebrowColor }]}>Esplora i quattro mondi</Text>
            </View>

            <TouchableOpacity
              onPress={onNextWorld}
              disabled={selectedWorldIdx === WORLDS.length - 1}
              style={[ms.worldArrow, { borderColor: world.cardBorder, backgroundColor: world.cardBg }]}
              activeOpacity={0.6}
            >
              <Text style={[ms.worldArrowText, { color: world.accent, opacity: selectedWorldIdx === WORLDS.length - 1 ? 0.2 : 1 }]}>{'›'}</Text>
            </TouchableOpacity>
          </View>

          {/* Instructions card */}
          <View style={[ms.instructions, { backgroundColor: world.cardBg, borderColor: world.cardBorder }]}>
            <View style={{ flex: 1 }}>
              <Text style={[ms.instructionTitle, { color: world.textColor }]}>{world.status}</Text>
              <Text style={[ms.instructionText, { color: world.secondaryText }]}>
                {RULES[world.id].label}{RULES[world.id].hint ? `\n${RULES[world.id].hint}` : ''}
              </Text>
            </View>
          </View>

          {/* Play button */}
          {locked ? (
            <View style={[ms.lockedButton]}>
              <Text style={ms.lockedButtonText}>
                Sblocca con {WORLDS[selectedWorldIdx].unlockScore} punti in {WORLDS[selectedWorldIdx - 1]?.title || ''}
              </Text>
            </View>
          ) : (
            <Animated.View style={{ transform: [{ scale: pulseAnim }] }}>
              <TouchableOpacity
                onPress={onStart}
                activeOpacity={0.85}
                style={[ms.playButtonOuter, { backgroundColor: world.buttonShadow }]}
              >
                <LinearGradient
                  colors={world.accentGradient}
                  start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
                  style={ms.playButtonInner}
                >
                  <Text style={ms.playButtonText}>GIOCA</Text>
                </LinearGradient>
              </TouchableOpacity>
            </Animated.View>
          )}

          {worldHigh > 0 && (
            <Text style={[ms.worldRecord, { color: world.eyebrowColor }]}>
              Record: {worldHigh}
            </Text>
          )}

          {/* Character link */}
          <TouchableOpacity onPress={onCharacters} activeOpacity={0.6}>
            <Text style={[ms.characterLink, { color: world.accent }]}>
              Scegli la tua mascotte  {'↗'}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

// ── Character select screen ──

const CARD_GAP = 12;
const CARD_WIDTH = (SCREEN_W - 48 - CARD_GAP * 2) / 3;

function CharacterSelectScreen({ selectedMascot, onSelect, onConfirm, onBack, world }) {
  const [tempSelection, setTempSelection] = useState(selectedMascot);

  return (
    <View style={{ flex: 1 }}>
      <LinearGradient colors={[world.menuBg[0], world.menuBg[1]]} style={StyleSheet.absoluteFill} />
      <MenuDecorations accent={world.accent} world={world} />
      <ScrollView style={{ flex: 1 }} contentContainerStyle={cs.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={cs.pageHeader}>
          <TouchableOpacity onPress={onBack} style={[cs.backButton, { borderColor: world.cardBorder, backgroundColor: world.cardBg }]} activeOpacity={0.6}>
            <Text style={[cs.backArrow, { color: world.accent }]}>{'‹'}</Text>
          </TouchableOpacity>
          <Text style={[cs.pageHeaderLabel, { color: world.eyebrowColor }]}>IL TUO COMPAGNO DI VIAGGIO</Text>
        </View>

        <Text style={[cs.pageTitle, { color: world.textColor }]}>Chi gioca con te?</Text>
        <Text style={[cs.pageSubtitle, { color: world.secondaryText }]}>Una piccola personalita per ogni avventura.</Text>

        {/* Grid */}
        <View style={cs.grid}>
          {MASCOTS.map((src, i) => (
            <TouchableOpacity
              key={i}
              onPress={() => setTempSelection(i)}
              activeOpacity={0.7}
              style={[
                cs.card,
                {
                  borderColor: i === tempSelection ? world.accent : '#fff',
                  backgroundColor: i === tempSelection ? (world.accent + '18') : 'rgba(255,255,255,0.5)',
                  borderWidth: i === tempSelection ? 2 : 1,
                  marginLeft: i % 3 > 0 ? CARD_GAP : 0,
                },
              ]}
            >
              {i === tempSelection && (
                <Text style={[cs.checkmark, { color: world.accentDark }]}>{'✓'}</Text>
              )}
              <Image source={src} style={cs.cardImage} />
              <Text style={[cs.cardName, { color: world.secondaryText }]}>{MASCOT_NAMES[i]}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>

      {/* Sticky confirm button */}
      <View style={cs.confirmArea}>
        <TouchableOpacity
          onPress={() => { onSelect(tempSelection); onConfirm(); }}
          activeOpacity={0.85}
          style={[ms.playButtonOuter, { backgroundColor: world.buttonShadow }]}
        >
          <LinearGradient
            colors={world.accentGradient}
            start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
            style={ms.playButtonInner}
          >
            <Text style={ms.playButtonText}>Andiamo a giocare  {'↗'}</Text>
          </LinearGradient>
        </TouchableOpacity>
      </View>
    </View>
  );
}

// ── Profile screen ──

function ProfileScreen({ selectedMascot, worldScores, onBack, onCharacters, world }) {
  const totalScore = getTotalScore(worldScores);
  const bestScore = getBestScore(worldScores);
  const completed = getWorldsCompleted(worldScores);

  return (
    <View style={{ flex: 1 }}>
      <LinearGradient colors={[world.menuBg[0], world.menuBg[1]]} style={StyleSheet.absoluteFill} />
      <MenuDecorations accent={world.accent} world={world} />
      <ScrollView style={{ flex: 1 }} contentContainerStyle={ps.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={cs.pageHeader}>
          <TouchableOpacity onPress={onBack} style={[cs.backButton, { borderColor: world.cardBorder, backgroundColor: world.cardBg }]} activeOpacity={0.6}>
            <Text style={[cs.backArrow, { color: world.accent }]}>{'‹'}</Text>
          </TouchableOpacity>
          <Text style={[cs.pageHeaderLabel, { color: world.eyebrowColor }]}>IL TUO VIAGGIO, FIN QUI</Text>
        </View>

        {/* Avatar */}
        <View style={[ps.avatar, { borderColor: world.cardBorder, backgroundColor: world.cardBg }]}>
          <Image source={MASCOTS[selectedMascot]} style={ps.avatarImage} />
        </View>

        <Text style={[cs.pageTitle, { color: world.textColor }]}>Esploratore cosmico</Text>
        <Text style={[cs.pageSubtitle, { color: world.secondaryText }]}>Ogni rimbalzo lascia il segno.</Text>

        {/* Total score card */}
        <View style={[ps.totalCard, { backgroundColor: world.cardBg, borderColor: world.cardBorder }]}>
          <Text style={[ps.totalLabel, { color: world.eyebrowColor }]}>PUNTI TOTALI</Text>
          <Text style={[ps.totalValue, { color: world.accentDark }]}>{totalScore}</Text>
        </View>

        {/* Stats row */}
        <View style={ps.statsRow}>
          <View style={[ps.statCard, { borderColor: world.cardBorder, backgroundColor: world.cardBg }]}>
            <Text style={[ps.statValue, { color: world.accent }]}>{bestScore}</Text>
            <Text style={[ps.statLabel, { color: world.eyebrowColor }]}>Record in una partita</Text>
          </View>
          <View style={[ps.statCard, { borderColor: world.cardBorder, backgroundColor: world.cardBg }]}>
            <Text style={[ps.statValue, { color: world.accent }]}>{completed}</Text>
            <Text style={[ps.statLabel, { color: world.eyebrowColor }]}>Mondi completati</Text>
          </View>
        </View>

        {/* Per-world scores */}
        <Text style={[ps.sectionTitle, { color: world.textColor }]}>Record per mondo</Text>
        {WORLDS.map((w, i) => {
          const unlocked = isWorldUnlocked(i, worldScores);
          const score = worldScores[w.id] || 0;
          return (
            <View key={w.id} style={[ps.worldRow, { backgroundColor: world.cardBg, borderColor: world.cardBorder }]}>
              <View>
                <Text style={[ps.worldRowTitle, { color: unlocked ? world.textColor : '#aaa' }]}>{w.chapter}: {w.title}</Text>
                <Text style={[ps.worldRowSub, { color: world.secondaryText }]}>
                  {unlocked ? (score > 0 ? `${score} punti` : 'Non ancora giocato') : 'Bloccato'}
                </Text>
              </View>
              {unlocked && score > 0 && (
                <Text style={[ps.worldRowScore, { color: world.accent }]}>{score}</Text>
              )}
            </View>
          );
        })}

        {/* Change mascot */}
        <TouchableOpacity onPress={onCharacters} activeOpacity={0.7}
          style={[ps.changeButton, { borderColor: world.cardBorder, backgroundColor: world.cardBg }]}>
          <Text style={[ps.changeButtonText, { color: world.accent }]}>Cambia mascotte  {'↗'}</Text>
        </TouchableOpacity>

        <Text style={[ps.storageNote, { color: world.eyebrowColor }]}>
          I tuoi progressi sono salvati su questo dispositivo.
        </Text>
      </ScrollView>
    </View>
  );
}

// ── Game over screen ──

function GameOverScreen({ score, worldHighScore, collected, world, selectedMascot, onRestart, onMenu }) {
  const scaleAnim = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.spring(scaleAnim, { toValue: 1, useNativeDriver: true, friction: 5, tension: 60 }).start();
  }, []);

  const isRecord = score >= worldHighScore && score > 0;

  return (
    <View style={{ flex: 1 }}>
      <LinearGradient colors={[world.menuBg[0], world.menuBg[1]]} style={StyleSheet.absoluteFill} />
      <MenuDecorations accent={world.accent} world={world} />

      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', padding: 25 }}>
        <Animated.View style={[go.card, { transform: [{ scale: scaleAnim }], borderColor: world.cardBorder, backgroundColor: world.cardBg }]}>
          {/* Medal */}
          <Text style={[go.eyebrow, { color: world.eyebrowColor }]}>{world.chapter}</Text>
          <Text style={[go.scoreNumber, { color: world.textColor }]}>{score}</Text>
          <Text style={[go.scoreLabel, { color: world.secondaryText }]}>punti</Text>

          {isRecord && (
            <View style={[go.recordBadge, { backgroundColor: world.accent + '18', borderColor: world.accent + '40' }]}>
              <Text style={[go.recordText, { color: world.accent }]}>Nuovo Record!</Text>
            </View>
          )}

          {collected.length > 0 && (
            <View style={go.collectedArea}>
              <Text style={[go.collectedLabel, { color: world.eyebrowColor }]}>Raccolti: {collected.length}</Text>
              <View style={go.collectedRow}>
                {collected.slice(-8).map((idx, i) => (
                  <Image key={i} source={MASCOTS[idx]} style={go.collectedIcon} />
                ))}
              </View>
            </View>
          )}

          {/* Restart */}
          <TouchableOpacity onPress={onRestart} activeOpacity={0.85}
            style={[ms.playButtonOuter, { backgroundColor: world.buttonShadow, marginTop: 24, width: '100%' }]}>
            <LinearGradient colors={world.accentGradient} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
              style={[ms.playButtonInner]}>
              <Text style={ms.playButtonText}>RIPROVA</Text>
            </LinearGradient>
          </TouchableOpacity>

          {/* Menu */}
          <TouchableOpacity onPress={onMenu} activeOpacity={0.7}
            style={[go.menuButton, { borderColor: world.cardBorder }]}>
            <Text style={[go.menuButtonText, { color: world.secondaryText }]}>MENU PRINCIPALE</Text>
          </TouchableOpacity>
        </Animated.View>
      </View>
    </View>
  );
}

// ── Main app ──

export default function App() {
  const [screen, setScreen] = useState('menu');
  const saved = useMemo(() => loadProgress() || {}, []);
  const [selectedWorld, setSelectedWorld] = useState(
    Number.isInteger(saved.selectedWorld) && saved.selectedWorld >= 0 && saved.selectedWorld < WORLDS.length ? saved.selectedWorld : 0
  );
  const [selectedMascot, setSelectedMascot] = useState(
    Number.isInteger(saved.selectedMascot) && saved.selectedMascot >= 0 && saved.selectedMascot < MASCOTS.length ? saved.selectedMascot : 0
  );
  const [worldScores, setWorldScores] = useState(() =>
    Object.fromEntries(WORLDS.map(w => [w.id, Number(saved.worldScores?.[w.id]) || 0]))
  );

  useEffect(() => { requestPersistentStorage(); }, []);
  useEffect(() => {
    saveProgress({ worldScores, selectedWorld, selectedMascot });
  }, [worldScores, selectedWorld, selectedMascot]);

  const [score, setScore] = useState(0);
  const [playerY, setPlayerY] = useState(SCREEN_H * 0.5);
  const [playerX] = useState(SCREEN_W * 0.22);
  const [gravityDown, setGravityDown] = useState(true);
  const [platforms, setPlatforms] = useState([]);
  const [bursts, setBursts] = useState([]);
  const [flipCount, setFlipCount] = useState(0);
  const [collected, setCollected] = useState([]);
  const [trail, setTrail] = useState([]);
  const [scrollOffset, setScrollOffset] = useState(0);
  const [meteors, setMeteors] = useState([]);

  const gameRef = useRef({
    playerY: SCREEN_H * 0.5, velY: 0, gravityDown: true,
    platforms: [], scrollSpeed: 0, score: 0, running: false,
    frameCount: 0, collected: [], onPlatform: true,
    trail: [], totalScroll: 0, world: WORLDS[0],
  });
  const rafRef = useRef(null);
  const squashAnim = useRef(new Animated.Value(1)).current;

  const world = WORLDS[selectedWorld];
  const locked = !isWorldUnlocked(selectedWorld, worldScores);

  const doSquash = useCallback(() => {
    squashAnim.setValue(0.65);
    Animated.spring(squashAnim, { toValue: 1, friction: 3, tension: 180, useNativeDriver: true }).start();
  }, []);

  const initGame = useCallback(() => {
    const w = WORLDS[selectedWorld];
    const g = gameRef.current;
    g.world = w;
    g.playerY = SCREEN_H * 0.5;
    g.velY = 0;
    g.gravityDown = true;
    g.scrollSpeed = w.scrollSpeed;
    g.score = 0;
    g.frameCount = 0;
    g.elapsed = 0;
    g.meteors = [];
    g.nextMeteorAt = 6;
    g.meteorId = 0;
    setMeteors([]);
    g.scoreClock = 0;
    g.course = createCourse(w, SCREEN_H);
    g.collected = [];
    g.onPlatform = false;
    g.trail = [];
    g.totalScroll = 0;

    const plats = [];
    plats.push({
      x: playerX - 40, y: SCREEN_H * 0.5 + PLAYER_SIZE,
      w: 130, hasCollectible: false, collectibleMascot: 0,
      collected: false, colorIdx: 0, id: Math.random(),
    });
    while (plats[plats.length - 1].x < SCREEN_W + 350) {
      plats.push(nextPlatform(g.course, plats[plats.length - 1]));
    }
    g.platforms = plats;

    setScore(0);
    setGravityDown(true);
    setPlatforms([...plats]);
    setPlayerY(g.playerY);
    setCollected([]);
    setBursts([]);
    setFlipCount(0);
    setTrail([]);
    setScrollOffset(0);
  }, [playerX, selectedWorld]);

  const startGame = useCallback(() => {
    initGame();
    gameRef.current.running = true;
    setScreen('playing');
  }, [initGame]);

  const flipGravity = useCallback(() => {
    if (gameRef.current.running) {
      const g = gameRef.current;
      g.gravityDown = !g.gravityDown;
      g.velY = g.gravityDown ? g.world.gravity * 3 : -g.world.gravity * 3;
      g.onPlatform = false;
      setGravityDown(g.gravityDown);
      setFlipCount(c => c + 1);
    }
  }, []);

  const sweepAway = useCallback((id) => {
    const g = gameRef.current;
    if (!g.running) return;
    const plat = g.platforms.find(p => p.id === id && p.type === 'sweep');
    if (!plat) return;
    g.platforms = sweepPlatform(g.platforms, id);
    setPlatforms([...g.platforms]);
    setBursts(prev => [...prev, { x: plat.x + plat.w / 2 - 20, y: plat.y - 20, id: Math.random() }]);
  }, []);

  const gameOver = useCallback(() => {
    gameRef.current.running = false;
    const finalScore = gameRef.current.score;
    const wId = gameRef.current.world.id;
    setWorldScores(prev => ({
      ...prev,
      [wId]: Math.max(prev[wId], finalScore),
    }));
    setScreen('gameover');
  }, []);

  // Game loop
  useEffect(() => {
    if (screen !== 'playing') return;
    let lastTime = performance.now();

    const loop = (now) => {
      const g = gameRef.current;
      if (!g.running) return;
      const w = g.world;
      const dt = Math.min((now - lastTime) / 16.667, 3);
      lastTime = now;

      g.frameCount++;
      const beforeTime = g.elapsed;
      g.elapsed += dt / 60;
      g.scrollSpeed = w.id === 'nebulosa'
        ? w.scrollSpeed + Math.min(1.5, Math.max(0, g.elapsed - 10) * .055)
        : Math.min(w.scrollSpeed * 1.5, w.scrollSpeed + g.elapsed * 60 * w.scrollIncrement);
      const previousY = g.playerY;

      const grav = (g.gravityDown ? w.gravity : -w.gravity) * gravityFactor(w.id, g.elapsed);
      if (!g.onPlatform) g.velY += grav * dt;
      const maxVelocity = w.id === 'asteroidi' ? 18 : 14;
      g.velY = Math.max(-maxVelocity, Math.min(maxVelocity, g.velY));
      g.playerY += g.velY * dt;

      const scrollAmt = g.scrollSpeed * dt;
      g.totalScroll += scrollAmt;

      for (let i = g.platforms.length - 1; i >= 0; i--) {
        g.platforms[i].previousY = g.platforms[i].y;
        g.platforms[i].y = platformY(g.platforms[i], g.elapsed);
        g.platforms[i].x -= scrollAmt;
        if (g.platforms[i].x + g.platforms[i].w < -20) {
          g.platforms.splice(i, 1);
        }
      }

      g.course.elapsed = g.elapsed;
      const lastPlat = g.platforms[g.platforms.length - 1];
      if (lastPlat) {
        while (g.platforms[g.platforms.length - 1].x < SCREEN_W + 350) {
          g.platforms.push(nextPlatform(g.course, g.platforms[g.platforms.length - 1]));
        }
      }

      if (g.frameCount % 3 === 0) {
        g.trail.push({ x: playerX, y: g.playerY });
        if (g.trail.length > TRAIL_LENGTH) g.trail.shift();
      }

      g.onPlatform = false;
      const pLeft = playerX;
      const pRight = playerX + PLAYER_SIZE;
      const pTop = g.playerY;
      const pBottom = g.playerY + PLAYER_SIZE;

      for (const plat of g.platforms) {
        const overlapX = pRight > plat.x + 5 && pLeft < plat.x + plat.w - 5;
        if (!overlapX) continue;

        if (g.gravityDown) {
          if (g.velY >= 0 && pBottom >= plat.y && previousY + PLAYER_SIZE <= (plat.previousY ?? plat.y) + 4) {
            g.playerY = plat.y - PLAYER_SIZE;
            g.velY = bounceVelocity(w.bounceVel, plat.type, true);
            g.onPlatform = true;
            if (plat.type === 'crumble' && plat.hitAt == null) plat.hitAt = g.elapsed;
            doSquash();
          }
        } else {
          if (g.velY <= 0 && pTop <= plat.y + PLATFORM_H && previousY >= (plat.previousY ?? plat.y) + PLATFORM_H - 4) {
            g.playerY = plat.y + PLATFORM_H;
            g.velY = bounceVelocity(w.bounceVel, plat.type, false);
            g.onPlatform = true;
            if (plat.type === 'crumble' && plat.hitAt == null) plat.hitAt = g.elapsed;
            doSquash();
          }
        }

        if (!plat.collected && plat.hasCollectible) {
          const cx = plat.x + plat.w / 2 - COLLECTIBLE_SIZE / 2;
          const cy = plat.y - COLLECTIBLE_SIZE - 10;
          if (pRight > cx && pLeft < cx + COLLECTIBLE_SIZE && pBottom > cy && pTop < cy + COLLECTIBLE_SIZE) {
            plat.collected = true;
            g.score += 10;
            g.collected.push(plat.collectibleMascot);
            setScore(g.score);
            setCollected([...g.collected]);
            setBursts(prev => [...prev, { x: cx, y: cy, id: Math.random() }]);
          }
        }
      }

      // Keep the first bounce, then remove touched fragile platforms before rendering.
      // This applies to both upper and lower contact, with no second landing window.
      g.platforms = g.platforms.filter(plat => plat.hitAt == null);

      g.scoreClock += dt;
      if (g.scoreClock >= 10) {
        g.score += Math.floor(g.scoreClock / 10);
        g.scoreClock %= 10;
        setScore(g.score);
      }

      if (w.id === 'buconero') {
        if (g.elapsed >= g.nextMeteorAt) {
          g.meteors.push(createMeteor(++g.meteorId, g.elapsed, SCREEN_W, SCREEN_H, g.playerY + PLAYER_SIZE / 2));
          g.nextMeteorAt = g.elapsed + Math.max(3.5, 6 - g.elapsed / 60) + Math.random();
        }
        if (g.meteors.some(m => meteorHitsPlayer(m, beforeTime, g.elapsed, playerX, previousY, g.playerY, PLAYER_SIZE))) {
          gameOver();
          return;
        }
        g.meteors = g.meteors.filter(m => meteorPosition(m, g.elapsed).x > -160);
        setMeteors([...g.meteors]);
      }

      if (g.playerY > SCREEN_H + 50 || g.playerY < -50) {
        gameOver();
        return;
      }

      setPlayerY(g.playerY);
      setPlatforms([...g.platforms]);
      setTrail([...g.trail]);
      setScrollOffset(g.totalScroll);
      rafRef.current = requestAnimationFrame(loop);
    };

    rafRef.current = requestAnimationFrame(loop);
    return () => { if (rafRef.current) cancelAnimationFrame(rafRef.current); };
  }, [screen, doSquash, gameOver, playerX]);

  const removeBurst = useCallback((id) => {
    setBursts(prev => prev.filter(b => b.id !== id));
  }, []);

  // ── Screens ──

  if (screen === 'menu') {
    return (
      <>
        <StatusBar barStyle="dark-content" />
        <StartScreen
          world={world}
          selectedWorldIdx={selectedWorld}
          selectedMascot={selectedMascot}
          worldScores={worldScores}
          locked={locked}
          onStart={startGame}
          onPrevWorld={() => setSelectedWorld(i => Math.max(0, i - 1))}
          onNextWorld={() => setSelectedWorld(i => Math.min(WORLDS.length - 1, i + 1))}
          onDotPress={setSelectedWorld}
          onCharacters={() => setScreen('characters')}
          onProfile={() => setScreen('profile')}
        />
      </>
    );
  }

  if (screen === 'characters') {
    return (
      <>
        <StatusBar barStyle="dark-content" />
        <CharacterSelectScreen
          selectedMascot={selectedMascot}
          onSelect={setSelectedMascot}
          onConfirm={() => setScreen('menu')}
          onBack={() => setScreen('menu')}
          world={world}
        />
      </>
    );
  }

  if (screen === 'profile') {
    return (
      <>
        <StatusBar barStyle="dark-content" />
        <ProfileScreen
          selectedMascot={selectedMascot}
          worldScores={worldScores}
          onBack={() => setScreen('menu')}
          onCharacters={() => setScreen('characters')}
          world={world}
        />
      </>
    );
  }

  if (screen === 'gameover') {
    return (
      <>
        <StatusBar barStyle="dark-content" />
        <GameOverScreen
          score={score}
          worldHighScore={worldScores[world.id] || 0}
          collected={collected}
          world={world}
          selectedMascot={selectedMascot}
          onRestart={startGame}
          onMenu={() => setScreen('menu')}
        />
      </>
    );
  }

  // ── Playing ──
  return (
    <>
      <StatusBar hidden />
      <TouchableWithoutFeedback onPress={flipGravity}>
        <View style={gs.gameContainer}>
          <LinearGradient colors={world.gameBg} style={StyleSheet.absoluteFill} />
          <WorldScene world={world} offset={scrollOffset} width={SCREEN_W} height={SCREEN_H} />
          {world.id === 'buconero' && <DeepSpace offset={scrollOffset} width={SCREEN_W} height={SCREEN_H} />}

          {platforms.map(p => (
            <React.Fragment key={p.id}>
              <PlatformBlock x={p.x} y={p.y} w={p.w} colorIdx={p.colorIdx} type={p.type} hitAt={p.hitAt} onSweep={() => sweepAway(p.id)} asteroidWorld={world.id === 'asteroidi'} />
              {p.hasCollectible && !p.collected && (
                <CollectibleBlob
                  source={MASCOTS[p.collectibleMascot]}
                  left={p.x + p.w / 2 - COLLECTIBLE_SIZE / 2}
                  top={p.y - COLLECTIBLE_SIZE - 10}
                />
              )}
            </React.Fragment>
          ))}

          <PlayerTrail positions={trail} gravityDown={gravityDown} mascotSource={MASCOTS[selectedMascot]} />

          <Animated.View style={[gs.playerContainer, {
            left: playerX, top: playerY,
            transform: [
              { scaleX: squashAnim.interpolate({ inputRange: [0.65, 1], outputRange: [1.35, 1] }) },
              { scaleY: squashAnim },
              { rotate: gravityDown ? '0deg' : '180deg' },
            ],
          }]}>
            <Image source={MASCOTS[selectedMascot]} style={gs.playerImage} />
          </Animated.View>

          {bursts.map(b => (
            <CollectBurst key={b.id} x={b.x} y={b.y} onDone={() => removeBurst(b.id)} />
          ))}

          {world.id === 'buconero' && <MeteorField meteors={meteors} elapsed={gameRef.current.elapsed} width={SCREEN_W} />}
          <FlipFlash trigger={flipCount} />

          <View style={gs.hud}>
            <View style={gs.hudPill}>
              <Text style={gs.scoreLabel}>PUNTI</Text>
              <ScorePop value={score} />
            </View>
            <GravityIndicator down={gravityDown} />
          </View>

          <View pointerEvents="none" style={{ position: 'absolute', bottom: 38, left: 24, right: 24, alignItems: 'center' }}>
            <Text style={{ color: '#fff', fontSize: 10, letterSpacing: 3, fontWeight: '800' }}>{world.title.toUpperCase()} · SETTORE {Math.floor(scrollOffset / 2400) + 1}</Text>
            <View style={{ height: 3, width: 150, backgroundColor: '#ffffff25', marginVertical: 12, borderRadius: 3 }}>
              <View style={{ height: 3, width: `${(scrollOffset % 2400) / 24}%`, backgroundColor: world.accentEmphasis, borderRadius: 3 }} />
            </View>
            {!!RULES[world.id].hint && <Text style={{ color: '#d9d4e8', fontSize: 11, textAlign: 'center' }}>{RULES[world.id].hint}</Text>}
          </View>
          {collected.length > 0 && (
            <View style={gs.collectedStrip}>
              <View style={gs.collectedPill}>
                {collected.slice(-6).map((idx, i) => (
                  <Image key={i} source={MASCOTS[idx]} style={gs.collectedIcon} />
                ))}
              </View>
            </View>
          )}
        </View>
      </TouchableWithoutFeedback>
    </>
  );
}

// ── Menu styles ──

const ms = StyleSheet.create({
  profileButtonWrapper: {
    position: 'absolute', top: Platform.OS === 'ios' ? 54 : 32,
    left: 0, right: 0, alignItems: 'center', zIndex: 5,
  },
  profileButton: {
    flexDirection: 'row', alignItems: 'center', gap: 9,
    paddingVertical: 9, paddingHorizontal: 15,
    borderWidth: 1, borderRadius: 22,
  },
  profileSymbol: { fontSize: 22 },
  profileLabel: { fontSize: 8, fontWeight: '800', letterSpacing: 1.5 },
  profileScore: { fontSize: 13, fontWeight: '700', marginTop: 2 },

  menuLayout: {
    flex: 1, justifyContent: 'space-between',
    paddingTop: COMPACT ? 80 : 106, paddingBottom: COMPACT ? 23 : 38,
    paddingHorizontal: 26, alignItems: 'center',
  },
  menuTop: { alignItems: 'center', width: '100%', maxWidth: 350 },
  eyebrow: { fontSize: 10, letterSpacing: 2.5, fontWeight: '800' },
  title: {
    fontSize: COMPACT ? 40 : 50, lineHeight: COMPACT ? 42 : 52,
    letterSpacing: -2.5, marginTop: 14, fontWeight: '800', textAlign: 'center',
  },

  mascotArea: { alignItems: 'center', justifyContent: 'center' },
  mascotGlow: {
    position: 'absolute', width: 140, height: 140,
    borderRadius: 70, opacity: 0.12,
  },
  mascotImage: { width: 100, height: 100, resizeMode: 'contain' },

  menuBottom: { width: '100%', maxWidth: 350, alignItems: 'center' },
  worldNav: {
    flexDirection: 'row', alignItems: 'center',
    justifyContent: 'space-between', width: '100%', marginBottom: 18,
  },
  worldArrow: {
    width: 42, height: 42, borderRadius: 21,
    borderWidth: 1, alignItems: 'center', justifyContent: 'center',
  },
  worldArrowText: { fontSize: 28, lineHeight: 32, marginTop: -2 },
  worldDots: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 4 },
  dot: { height: 7, borderRadius: 8 },
  swipeLabel: { fontSize: 10, letterSpacing: 0.4, marginTop: 6 },

  instructions: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    borderWidth: 1, borderRadius: 20,
    paddingVertical: COMPACT ? 10 : 15, paddingHorizontal: COMPACT ? 14 : 18,
    marginBottom: 20, width: '100%',
  },
  instructionIcon: { fontSize: 25 },
  instructionTitle: { fontSize: 13, fontWeight: '700', marginBottom: 3 },
  instructionText: { fontSize: 12, lineHeight: 18 },

  playButtonOuter: { borderRadius: 21, paddingBottom: 6 },
  playButtonInner: { paddingVertical: 18, paddingHorizontal: 40, borderRadius: 21, alignItems: 'center' },
  playButtonText: { color: '#fff', fontSize: 16, fontWeight: '800', letterSpacing: 1.5 },

  lockedButton: {
    backgroundColor: '#b0acb5', borderRadius: 21,
    paddingVertical: 18, paddingHorizontal: 30, alignItems: 'center',
  },
  lockedButtonText: { color: '#fff', fontSize: 13, fontWeight: '700', textAlign: 'center' },

  worldRecord: { fontSize: 12, fontWeight: '700', letterSpacing: 1, marginTop: 14 },
  characterLink: { fontSize: 13, fontWeight: '650', paddingTop: 16 },
});

// ── Character select styles ──

const cs = StyleSheet.create({
  scrollContent: { paddingHorizontal: 24, paddingTop: Platform.OS === 'ios' ? 60 : 38, paddingBottom: 100 },
  pageHeader: { flexDirection: 'row', alignItems: 'center', gap: 16 },
  backButton: {
    width: 44, height: 44, borderRadius: 22,
    borderWidth: 1, alignItems: 'center', justifyContent: 'center',
  },
  backArrow: { fontSize: 29, lineHeight: 33, marginTop: -2 },
  pageHeaderLabel: { fontSize: 9, letterSpacing: 1.8, fontWeight: '750' },
  pageTitle: { fontSize: 32, letterSpacing: -1.3, fontWeight: '800', marginTop: 25, textAlign: 'center' },
  pageSubtitle: { fontSize: 13, textAlign: 'center', marginTop: 6 },
  grid: {
    flexDirection: 'row', flexWrap: 'wrap',
    marginTop: 28,
  },
  card: {
    width: CARD_WIDTH, borderRadius: 22,
    paddingVertical: 14, paddingHorizontal: 4,
    alignItems: 'center', marginBottom: CARD_GAP, position: 'relative',
  },
  checkmark: { position: 'absolute', right: 7, top: 5, fontSize: 14, fontWeight: '700' },
  cardImage: { width: 56, height: 56, resizeMode: 'contain' },
  cardName: { fontSize: 10, marginTop: 10, textAlign: 'center' },
  confirmArea: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    paddingHorizontal: 24, paddingBottom: Platform.OS === 'ios' ? 34 : 20, paddingTop: 12,
  },
});

// ── Profile styles ──

const ps = StyleSheet.create({
  scrollContent: { paddingHorizontal: 24, paddingTop: Platform.OS === 'ios' ? 60 : 38, paddingBottom: 40, alignItems: 'center' },
  avatar: {
    marginTop: 30, width: 116, height: 116,
    borderRadius: 58, borderWidth: 1,
    alignItems: 'center', justifyContent: 'center',
  },
  avatarImage: { width: 78, height: 78, resizeMode: 'contain' },
  totalCard: {
    borderWidth: 1, borderRadius: 27,
    paddingVertical: 27, paddingHorizontal: 27,
    marginTop: 28, alignItems: 'center', width: '100%',
  },
  totalLabel: { fontSize: 10, letterSpacing: 2, fontWeight: '800' },
  totalValue: { fontSize: 55, letterSpacing: -2, fontWeight: '800', marginTop: 8 },
  statsRow: { flexDirection: 'row', gap: 12, marginTop: 14, width: '100%' },
  statCard: {
    flex: 1, borderWidth: 1, borderRadius: 22,
    paddingVertical: 20, paddingHorizontal: 10, alignItems: 'center',
  },
  statValue: { fontSize: 25, fontWeight: '800' },
  statLabel: { fontSize: 10, marginTop: 8, textAlign: 'center' },
  sectionTitle: { fontSize: 18, fontWeight: '800', letterSpacing: -0.5, marginTop: 28, marginBottom: 12, alignSelf: 'flex-start' },
  worldRow: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    borderWidth: 1, borderRadius: 16,
    paddingVertical: 14, paddingHorizontal: 16, marginBottom: 8, width: '100%',
  },
  worldRowTitle: { fontSize: 13, fontWeight: '700' },
  worldRowSub: { fontSize: 11, marginTop: 3 },
  worldRowScore: { fontSize: 22, fontWeight: '800' },
  changeButton: {
    borderWidth: 1, borderRadius: 17,
    paddingVertical: 14, paddingHorizontal: 20,
    marginTop: 20, width: '100%', alignItems: 'center',
  },
  changeButtonText: { fontSize: 14, fontWeight: '650' },
  storageNote: { fontSize: 11, marginTop: 20 },
});

// ── Game over styles ──

const go = StyleSheet.create({
  card: {
    borderRadius: 32, borderWidth: 1,
    paddingVertical: 30, paddingHorizontal: 25,
    alignItems: 'center', width: SCREEN_W * 0.85,
    maxWidth: 380,
  },
  medal: { fontSize: 40, marginBottom: 10 },
  eyebrow: { fontSize: 10, letterSpacing: 2.5, fontWeight: '800', marginBottom: 6 },
  scoreNumber: { fontSize: 70, fontWeight: '900', letterSpacing: -2 },
  scoreLabel: { fontSize: 14, letterSpacing: 2, marginBottom: 8 },
  recordBadge: {
    borderWidth: 1, borderRadius: 16,
    paddingHorizontal: 20, paddingVertical: 6, marginBottom: 4,
  },
  recordText: { fontSize: 14, fontWeight: '700', letterSpacing: 0.5 },
  collectedArea: { alignItems: 'center', marginTop: 16 },
  collectedLabel: { fontSize: 12, letterSpacing: 1, marginBottom: 8 },
  collectedRow: { flexDirection: 'row', gap: 6 },
  collectedIcon: { width: 30, height: 30, resizeMode: 'contain' },
  menuButton: {
    marginTop: 14, paddingHorizontal: 44, paddingVertical: 13,
    borderRadius: 17, borderWidth: 1, width: '100%', alignItems: 'center',
  },
  menuButtonText: { fontSize: 13, fontWeight: '700', letterSpacing: 2 },
});

// ── Game styles ──

const gs = StyleSheet.create({
  gameContainer: { flex: 1 },
  playerContainer: { position: 'absolute', width: PLAYER_SIZE, height: PLAYER_SIZE },
  playerImage: { width: PLAYER_SIZE, height: PLAYER_SIZE, resizeMode: 'contain' },
  hud: {
    position: 'absolute', top: Platform.OS === 'ios' ? 54 : 32,
    left: 16, right: 16, flexDirection: 'row',
    justifyContent: 'space-between', alignItems: 'center',
  },
  hudPill: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.08)',
    paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, gap: 8,
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.06)',
  },
  scoreLabel: { fontSize: 10, fontWeight: '700', color: 'rgba(255,255,255,0.35)', letterSpacing: 1.5 },
  scoreValue: { fontSize: 24, fontWeight: '900', color: '#fff' },
  gravityPill: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.08)',
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.06)',
  },
  arrowShaft: { width: 2.5, height: 14, backgroundColor: 'rgba(255,255,255,0.5)', borderRadius: 2 },
  arrowHead: {
    width: 0, height: 0,
    borderLeftWidth: 6, borderRightWidth: 6, borderTopWidth: 7,
    borderLeftColor: 'transparent', borderRightColor: 'transparent',
    borderTopColor: 'rgba(255,255,255,0.5)', marginTop: -1,
  },
  collectedStrip: {
    position: 'absolute', bottom: Platform.OS === 'ios' ? 44 : 22,
    left: 0, right: 0, alignItems: 'center',
  },
  collectedPill: {
    flexDirection: 'row', backgroundColor: 'rgba(255,255,255,0.08)',
    paddingHorizontal: 14, paddingVertical: 8, borderRadius: 22, gap: 8,
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.06)',
  },
  collectedIcon: { width: 30, height: 30, resizeMode: 'contain' },
});
