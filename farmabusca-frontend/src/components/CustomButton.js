import React, { useRef } from 'react';
import { TouchableOpacity, Text, ActivityIndicator, Animated } from 'react-native';

export default function CustomButton({ title, onPress, loading = false, variant = 'primary', disabled = false, style }) {
  const scale = useRef(new Animated.Value(1)).current;
  const backgroundColor = disabled ? '#C6DCC6' : variant === 'secondary' ? '#EAF8EE' : '#2F9E5D';
  const textColor = variant === 'secondary' ? '#2F9E5D' : '#FFFFFF';

  const handleIn = () => {
    if (!disabled) Animated.spring(scale, { toValue: 0.98, useNativeDriver: true }).start();
  };
  const handleOut = () => {
    if (!disabled) Animated.spring(scale, { toValue: 1, useNativeDriver: true }).start();
  };

  return (
    <Animated.View style={{ transform: [{ scale }] }}>
      <TouchableOpacity
        onPress={disabled ? undefined : onPress}
        onPressIn={handleIn}
        onPressOut={handleOut}
        style={{
          backgroundColor,
          paddingVertical: 14,
          borderRadius: 999,
          alignItems: 'center',
          marginTop: 12,
          opacity: disabled ? 0.7 : 1,
          ...style,
        }}
        activeOpacity={0.9}
      >
        {loading ? (
          <ActivityIndicator color={textColor} />
        ) : (
          <Text style={{ color: textColor, fontWeight: '700', fontSize: 16 }}>{title}</Text>
        )}
      </TouchableOpacity>
    </Animated.View>
  );
}
