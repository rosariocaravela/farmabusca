import React, { useRef } from 'react';
import { Pressable, Text, ActivityIndicator, Animated, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, radius } from '../theme';

export default function CustomButton({ title, onPress, loading = false, variant = 'primary', disabled = false, style, icon }) {
  const scale = useRef(new Animated.Value(1)).current;
  const inactive = disabled || loading;
  const backgroundColor = inactive ? colors.disabled : variant === 'secondary' ? colors.primaryLight : variant === 'danger' ? colors.error : colors.primary;
  const textColor = variant === 'secondary' ? colors.primaryDark : colors.surface;

  const handleIn = () => {
    if (!disabled) Animated.spring(scale, { toValue: 0.98, useNativeDriver: true }).start();
  };
  const handleOut = () => {
    if (!disabled) Animated.spring(scale, { toValue: 1, useNativeDriver: true }).start();
  };

  return (
    <Animated.View style={{ transform: [{ scale }] }}>
      <Pressable
        onPress={inactive ? undefined : onPress}
        onPressIn={handleIn}
        onPressOut={handleOut}
        style={[{
          backgroundColor,
          minHeight: 52,
          paddingVertical: 13,
          paddingHorizontal: 18,
          borderRadius: radius.md,
          alignItems: 'center', justifyContent: 'center',
          marginTop: 12,
          opacity: disabled ? 0.7 : 1,
        }, style]}
        accessibilityRole="button" accessibilityLabel={title} accessibilityState={{ disabled: inactive, busy: loading }}
      >
        {loading ? (
          <ActivityIndicator color={textColor} />
        ) : (
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            {icon ? <Ionicons name={icon} size={19} color={textColor} /> : null}
            <Text style={{ color: textColor, fontWeight: '700', fontSize: 15, letterSpacing: 0.1 }}>{title}</Text>
          </View>
        )}
      </Pressable>
    </Animated.View>
  );
}
