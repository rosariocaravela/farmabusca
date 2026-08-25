import React, { useEffect, useState } from 'react';
import { Image, StyleSheet, View } from 'react-native';

export default function ResilientImage({ uri, fallback, style, children, ...props }) {
  const [failed, setFailed] = useState(false);
  useEffect(() => setFailed(false), [uri]);
  if (!uri || failed) {
    if (fallback) return <Image source={fallback} style={style} resizeMode="cover" {...props} />;
    return <View style={[styles.fallback, style]}>{children}</View>;
  }
  return <Image source={{ uri }} style={style} resizeMode="cover" onError={() => setFailed(true)} {...props} />;
}

const styles = StyleSheet.create({ fallback: { overflow: 'hidden' } });
