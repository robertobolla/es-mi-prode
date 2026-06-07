import React from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    Modal,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';

interface ShareMediaPickerProps {
    visible: boolean;
    onClose: () => void;
    onSelect: (uri: string, type: 'image' | 'video') => void;
    title?: string;
    subtitle?: string;
}

export const ShareMediaPicker: React.FC<ShareMediaPickerProps> = ({
    visible,
    onClose,
    onSelect,
    title,
    subtitle
}) => {
    const insets = useSafeAreaInsets();

    const pickImage = async (useCamera: boolean) => {
        try {
            const permission = useCamera
                ? await ImagePicker.requestCameraPermissionsAsync()
                : await ImagePicker.requestMediaLibraryPermissionsAsync();

            if (!permission.granted) {
                alert('Se necesita permiso para acceder a la cámara/galería');
                return;
            }

            const options: ImagePicker.ImagePickerOptions = {
                mediaTypes: ImagePicker.MediaTypeOptions.All,
                allowsEditing: false,
                quality: 1,
            };

            const result = useCamera
                ? await ImagePicker.launchCameraAsync(options)
                : await ImagePicker.launchImageLibraryAsync(options);

            if (!result.canceled && result.assets && result.assets[0]) {
                const asset = result.assets[0];
                const type = asset.type === 'video' || (asset.mimeType && asset.mimeType.startsWith('video/')) ? 'video' : 'image';
                onSelect(asset.uri, type);
            }
        } catch (error) {
            console.error('Error al seleccionar multimedia:', error);
        }
    };

    return (
        <Modal
            visible={visible}
            transparent={false}
            animationType="fade"
            onRequestClose={onClose}
        >
            <View style={styles.container}>
                <View style={[styles.header, { paddingTop: Math.max(insets.top, 20) + 8 }]}>
                    <TouchableOpacity
                        onPress={onClose}
                        style={styles.backButton}
                        activeOpacity={0.7}
                        hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
                    >
                        <Ionicons name="arrow-back" size={24} color="#fff" />
                    </TouchableOpacity>
                    <Text style={styles.headerTitle}>{title || 'Compartir'}</Text>
                    <View style={{ width: 40 }} />
                </View>

                <View style={styles.content}>
                    <Text style={styles.pickTitle}>{title || 'Seleccioná tu foto o video'}</Text>
                    <Text style={styles.pickSubtitle}>{subtitle || 'Capturá un momento con la cámara o elegí un archivo de tu galería'}</Text>

                    <View style={styles.pickButtons}>
                        <TouchableOpacity
                            style={styles.pickButton}
                            onPress={() => pickImage(false)}
                            activeOpacity={0.7}
                        >
                            <View style={styles.iconCircle}>
                                <Ionicons name="images" size={32} color="#EAB308" />
                            </View>
                            <Text style={styles.pickButtonText}>Galería</Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={styles.pickButton}
                            onPress={() => pickImage(true)}
                            activeOpacity={0.7}
                        >
                            <View style={styles.iconCircle}>
                                <Ionicons name="camera" size={32} color="#EAB308" />
                            </View>
                            <Text style={styles.pickButtonText}>Cámara</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </View>
        </Modal>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#020617',
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
        paddingVertical: 12,
    },
    backButton: {
        padding: 8,
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: '600',
        color: '#fff',
    },
    content: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 24,
    },
    pickTitle: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#fff',
        textAlign: 'center',
        marginBottom: 8,
    },
    pickSubtitle: {
        fontSize: 15,
        color: '#94A3B8',
        textAlign: 'center',
        marginBottom: 48,
        lineHeight: 22,
    },
    pickButtons: {
        flexDirection: 'row',
        gap: 24,
    },
    pickButton: {
        backgroundColor: '#0F172A',
        borderRadius: 20,
        padding: 24,
        width: 140,
        alignItems: 'center',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.05)',
    },
    iconCircle: {
        width: 64,
        height: 64,
        borderRadius: 32,
        backgroundColor: 'rgba(234, 179, 8, 0.1)',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 12,
    },
    pickButtonText: {
        fontSize: 14,
        fontWeight: '600',
        color: '#fff',
    },
});
