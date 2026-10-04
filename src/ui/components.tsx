import React from 'react';
import {
  ActivityIndicator,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
  type KeyboardTypeOptions,
  type RefreshControlProps,
  type StyleProp,
  type TextStyle,
  type ViewStyle,
} from 'react-native';

import { Fonts, Radius, Spacing, useTheme } from './theme';

export function Screen({
  children,
  contentStyle,
  refreshControl,
}: {
  children: React.ReactNode;
  contentStyle?: StyleProp<ViewStyle>;
  refreshControl?: React.ReactElement<RefreshControlProps>;
}) {
  const c = useTheme();
  return (
    <View style={{ flex: 1, backgroundColor: c.background }}>
      <ScrollView
        contentContainerStyle={[{ padding: Spacing.md, gap: Spacing.md }, contentStyle]}
        keyboardShouldPersistTaps="handled"
        refreshControl={refreshControl}
      >
        {children}
      </ScrollView>
    </View>
  );
}

export function Card({
  children,
  style,
}: {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
}) {
  const c = useTheme();
  return (
    <View
      style={[
        {
          backgroundColor: c.surface,
          borderColor: c.border,
          borderWidth: StyleSheet.hairlineWidth,
          borderRadius: Radius.md,
          padding: Spacing.md,
          gap: Spacing.sm,
        },
        style,
      ]}
    >
      {children}
    </View>
  );
}

export function SectionTitle({ children }: { children: React.ReactNode }) {
  const c = useTheme();
  return (
    <Text style={{ color: c.textSecondary, fontSize: 13, fontWeight: '600', letterSpacing: 0.4, textTransform: 'uppercase' }}>
      {children}
    </Text>
  );
}

type ButtonVariant = 'primary' | 'secondary' | 'danger' | 'ghost';

export function AppButton({
  title,
  onPress,
  variant = 'primary',
  disabled,
  loading,
  style,
}: {
  title: string;
  onPress: () => void;
  variant?: ButtonVariant;
  disabled?: boolean;
  loading?: boolean;
  style?: StyleProp<ViewStyle>;
}) {
  const c = useTheme();
  const background =
    variant === 'primary'
      ? c.primary
      : variant === 'danger'
        ? c.dangerBg
        : variant === 'ghost'
          ? 'transparent'
          : c.surfaceAlt;
  const foreground =
    variant === 'primary' ? c.onPrimary : variant === 'danger' ? c.danger : c.text;

  return (
    <Pressable
      onPress={onPress}
      disabled={disabled || loading}
      style={({ pressed }) => [
        {
          backgroundColor: background,
          borderRadius: Radius.md,
          paddingVertical: 13,
          paddingHorizontal: Spacing.md,
          alignItems: 'center',
          justifyContent: 'center',
          opacity: disabled ? 0.45 : pressed ? 0.85 : 1,
        },
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator color={foreground} />
      ) : (
        <Text style={{ color: foreground, fontSize: 16, fontWeight: '600' }}>{title}</Text>
      )}
    </Pressable>
  );
}

export function TextField({
  label,
  value,
  onChangeText,
  placeholder,
  hint,
  error,
  keyboardType,
  autoCapitalize = 'none',
  multiline,
  editable = true,
  style,
}: {
  label?: string;
  value: string;
  onChangeText: (value: string) => void;
  placeholder?: string;
  hint?: string;
  error?: string;
  keyboardType?: KeyboardTypeOptions;
  autoCapitalize?: 'none' | 'characters' | 'sentences' | 'words';
  multiline?: boolean;
  editable?: boolean;
  style?: StyleProp<ViewStyle>;
}) {
  const c = useTheme();
  return (
    <View style={[{ gap: Spacing.xs }, style]}>
      {label ? <Text style={{ color: c.textSecondary, fontSize: 13, fontWeight: '600' }}>{label}</Text> : null}
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={c.textSecondary}
        keyboardType={keyboardType}
        autoCapitalize={autoCapitalize}
        autoCorrect={false}
        multiline={multiline}
        editable={editable}
        style={{
          backgroundColor: c.surfaceAlt,
          color: c.text,
          borderRadius: Radius.sm,
          borderWidth: 1,
          borderColor: error ? c.danger : c.border,
          paddingHorizontal: Spacing.sm + 4,
          paddingVertical: multiline ? Spacing.sm + 4 : Platform.OS === 'ios' ? 12 : 8,
          fontSize: 16,
          minHeight: multiline ? 96 : undefined,
          textAlignVertical: multiline ? 'top' : 'center',
        }}
      />
      {error ? <Text style={{ color: c.danger, fontSize: 13 }}>{error}</Text> : null}
      {!error && hint ? <Text style={{ color: c.textSecondary, fontSize: 13 }}>{hint}</Text> : null}
    </View>
  );
}

export function DateField({
  label,
  value,
  onChange,
  hint,
  error,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  hint?: string;
  error?: string;
}) {
  const c = useTheme();
  if (Platform.OS === 'web') {
    return (
      <View style={{ gap: Spacing.xs }}>
        <Text style={{ color: c.textSecondary, fontSize: 13, fontWeight: '600' }}>{label}</Text>
        <input
          type="date"
          value={value}
          onChange={(event) => onChange(event.target.value)}
          style={{
            backgroundColor: c.surfaceAlt,
            color: c.text,
            borderRadius: Radius.sm,
            borderWidth: 1,
            borderStyle: 'solid',
            borderColor: error ? c.danger : c.border,
            padding: '10px 12px',
            fontSize: 16,
            fontFamily: Fonts.sans,
            colorScheme: 'normal',
          }}
        />
        {error ? <Text style={{ color: c.danger, fontSize: 13 }}>{error}</Text> : null}
        {!error && hint ? <Text style={{ color: c.textSecondary, fontSize: 13 }}>{hint}</Text> : null}
      </View>
    );
  }
  return (
    <TextField
      label={label}
      value={value}
      onChangeText={onChange}
      placeholder="YYYY-MM-DD"
      hint={hint ?? 'The date on your latest OR/CR'}
      error={error}
      keyboardType="numbers-and-punctuation"
    />
  );
}

export type BadgeTone = 'success' | 'warning' | 'danger' | 'info' | 'neutral';

export function Badge({ label, tone = 'neutral' }: { label: string; tone?: BadgeTone }) {
  const c = useTheme();
  const map: Record<BadgeTone, { color: string; background: string }> = {
    success: { color: c.success, background: c.successBg },
    warning: { color: c.warning, background: c.warningBg },
    danger: { color: c.danger, background: c.dangerBg },
    info: { color: c.info, background: c.infoBg },
    neutral: { color: c.neutral, background: c.neutralBg },
  };
  const colors = map[tone];
  return (
    <View style={{ backgroundColor: colors.background, borderRadius: Radius.pill, paddingHorizontal: 10, paddingVertical: 4, alignSelf: 'flex-start' }}>
      <Text style={{ color: colors.color, fontSize: 12, fontWeight: '700' }}>{label}</Text>
    </View>
  );
}

export function Segmented<T extends string | number>({
  options,
  value,
  onChange,
}: {
  options: { value: T; label: string }[];
  value: T;
  onChange: (value: T) => void;
}) {
  const c = useTheme();
  return (
    <View style={{ flexDirection: 'row', backgroundColor: c.surfaceAlt, borderRadius: Radius.md, padding: 3, gap: 3 }}>
      {options.map((option) => {
        const active = option.value === value;
        return (
          <Pressable
            key={String(option.value)}
            onPress={() => onChange(option.value)}
            style={{
              flex: 1,
              paddingVertical: 9,
              borderRadius: Radius.sm + 2,
              backgroundColor: active ? c.primary : 'transparent',
              alignItems: 'center',
            }}
          >
            <Text style={{ color: active ? c.onPrimary : c.textSecondary, fontWeight: '600', fontSize: 14 }}>
              {option.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

export function EmptyState({
  title,
  message,
  action,
}: {
  title: string;
  message: string;
  action?: React.ReactNode;
}) {
  const c = useTheme();
  return (
    <Card style={{ alignItems: 'center', paddingVertical: Spacing.xl, gap: Spacing.sm }}>
      <Text style={{ color: c.text, fontSize: 18, fontWeight: '700', textAlign: 'center' }}>{title}</Text>
      <Text style={{ color: c.textSecondary, textAlign: 'center', lineHeight: 20 }}>{message}</Text>
      {action ? <View style={{ alignSelf: 'stretch', marginTop: Spacing.sm }}>{action}</View> : null}
    </Card>
  );
}

export function InfoRow({
  label,
  value,
  mono,
  valueStyle,
}: {
  label: string;
  value: string;
  mono?: boolean;
  valueStyle?: StyleProp<TextStyle>;
}) {
  const c = useTheme();
  return (
    <View style={{ flexDirection: 'row', justifyContent: 'space-between', gap: Spacing.md, alignItems: 'flex-start' }}>
      <Text style={{ color: c.textSecondary, fontSize: 14, flexShrink: 0 }}>{label}</Text>
      <Text
        style={[
          { color: c.text, fontSize: 14, fontWeight: '600', flexShrink: 1, textAlign: 'right' },
          mono ? { fontFamily: Fonts.mono } : null,
          valueStyle,
        ]}
      >
        {value}
      </Text>
    </View>
  );
}

export function LinkRow({
  title,
  subtitle,
  onPress,
}: {
  title: string;
  subtitle?: string;
  onPress: () => void;
}) {
  const c = useTheme();
  return (
    <Pressable onPress={onPress} style={({ pressed }) => ({ opacity: pressed ? 0.7 : 1 })}>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: Spacing.md }}>
        <View style={{ flexShrink: 1 }}>
          <Text style={{ color: c.text, fontSize: 15, fontWeight: '600' }}>{title}</Text>
          {subtitle ? <Text style={{ color: c.textSecondary, fontSize: 13 }}>{subtitle}</Text> : null}
        </View>
        <Text style={{ color: c.primary, fontSize: 15, fontWeight: '700' }}>{'>'}</Text>
      </View>
    </Pressable>
  );
}

export function PlateText({ value, size = 28 }: { value: string; size?: number }) {
  const c = useTheme();
  return (
    <Text style={{ color: c.text, fontFamily: Fonts.mono, fontWeight: '700', fontSize: size, letterSpacing: 2 }}>
      {value}
    </Text>
  );
}
