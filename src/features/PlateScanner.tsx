import { CameraView, useCameraPermissions } from 'expo-camera';
import { useRef, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { AppButton } from '@/ui/components';
import { Radius, Spacing } from '@/ui/theme';

export function PlateScanner({
  onCapture,
  onCancel,
}: {
  onCapture: (uri: string) => void;
  onCancel: () => void;
}) {
  const [permission, requestPermission] = useCameraPermissions();
  const cameraRef = useRef<CameraView>(null);
  const [ready, setReady] = useState(false);
  const [busy, setBusy] = useState(false);

  if (!permission) {
    return <View style={{ flex: 1, backgroundColor: '#000' }} />;
  }

  if (!permission.granted) {
    return (
      <View
        style={{
          flex: 1,
          backgroundColor: '#000',
          alignItems: 'center',
          justifyContent: 'center',
          padding: Spacing.lg,
          gap: Spacing.md,
        }}
      >
        <Text style={{ color: '#fff', fontSize: 17, fontWeight: '700', textAlign: 'center' }}>
          Camera access needed
        </Text>
        <Text style={{ color: '#CBD5E1', textAlign: 'center', lineHeight: 20 }}>
          Allow camera access so the app can read the plate. You can always type the number instead.
        </Text>
        <AppButton title="Allow camera" onPress={() => void requestPermission()} />
        <AppButton title="Cancel" variant="secondary" onPress={onCancel} />
      </View>
    );
  }

  const capture = async () => {
    if (!cameraRef.current || busy || !ready) return;
    setBusy(true);
    try {
      const photo = await cameraRef.current.takePictureAsync({ quality: 0.85 });
      if (photo?.uri) onCapture(photo.uri);
    } finally {
      setBusy(false);
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: '#000' }}>
      <CameraView
        ref={cameraRef}
        style={StyleSheet.absoluteFill}
        facing="back"
        onCameraReady={() => setReady(true)}
      />
      <View pointerEvents="none" style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
        <View
          style={{
            width: '86%',
            aspectRatio: 2.6,
            borderWidth: 2,
            borderColor: '#fff',
            borderRadius: Radius.md,
            backgroundColor: 'rgba(255,255,255,0.08)',
          }}
        />
        <Text
          style={{
            color: '#fff',
            marginTop: Spacing.sm,
            fontSize: 14,
            backgroundColor: 'rgba(0,0,0,0.55)',
            paddingHorizontal: 10,
            paddingVertical: 6,
            borderRadius: Radius.pill,
            overflow: 'hidden',
          }}
        >
          Fit the plate inside the frame
        </Text>
      </View>
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: Spacing.lg,
          paddingBottom: Spacing.xl,
        }}
      >
        <AppButton title="Cancel" variant="secondary" onPress={onCancel} style={{ minWidth: 110 }} />
        <Pressable
          onPress={() => void capture()}
          disabled={!ready || busy}
          style={{
            width: 72,
            height: 72,
            borderRadius: 36,
            backgroundColor: '#fff',
            borderWidth: 4,
            borderColor: 'rgba(255,255,255,0.5)',
            opacity: ready && !busy ? 1 : 0.5,
          }}
        />
        <View style={{ minWidth: 110 }} />
      </View>
    </View>
  );
}
