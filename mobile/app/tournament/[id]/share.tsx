import React, { useState, useEffect, useRef } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    Dimensions,
    StatusBar,
    ActivityIndicator,
    Alert,
    Platform,
    Image,
    ScrollView,
} from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import * as ImagePicker from 'expo-image-picker';
import * as Sharing from 'expo-sharing';
import { captureRef } from 'react-native-view-shot';
import { Gesture, GestureDetector, GestureHandlerRootView } from 'react-native-gesture-handler';
import Animated, { useSharedValue, useAnimatedStyle } from 'react-native-reanimated';
import { Video, ResizeMode } from 'expo-av';
import * as FileSystem from 'expo-file-system';
import { api } from '../../../lib/api';
import { ShareMediaPicker } from '../../../components/ShareMediaPicker';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

const CAPTURE_WIDTH = SCREEN_WIDTH;
const CAPTURE_HEIGHT = Math.min((SCREEN_WIDTH * 16) / 9, SCREEN_HEIGHT);

// Dynamic loading of react-native-share to avoid issues in Expo Go
interface ShareSingleOptions {
    social: string;
    stickerImage?: string;
    backgroundImage?: string;
    backgroundVideo?: string;
    backgroundTopColor?: string;
    backgroundBottomColor?: string;
    appId?: string;
}

let ShareModule: {
    shareSingle: (options: ShareSingleOptions) => Promise<unknown>;
    open: (options: { url: string; type: string }) => Promise<unknown>;
} | null = null;

let SocialEnum: {
    InstagramStories: string;
} | null = null;

try {
    const RNShareModule = require('react-native-share');
    ShareModule = RNShareModule.default;
    SocialEnum = RNShareModule.Social;
} catch (error) {
    // Standard Expo Go fallback
}

interface TournamentPointsSystem {
    exactMatch?: number;
    exact?: number;
    correctResult?: number;
    result?: number;
    matchdayWinner?: number;
    topScorer?: number;
    mvp?: number;
    goalkeeper?: number;
    groupExact?: number;
    groupBoth?: number;
    groupOne?: number;
}

interface TournamentMember {
    id: string;
    userId: string;
    totalPoints: number;
    exactResults: number;
    correctResults: number;
    matchdayWins: number;
    user?: {
        username?: string;
        avatarUrl?: string | null;
    };
}

interface TournamentDetail {
    id: string;
    creatorId: string;
    name: string;
    competitionId?: string | null;
    competition?: {
        id: string;
        name: string;
    } | null;
    shareCode: string;
    members?: TournamentMember[];
    pointsSystem?: TournamentPointsSystem;
    format?: string;
}

export default function ShareTournamentScreen() {
    const { id } = useLocalSearchParams();
    const [tournament, setTournament] = useState<TournamentDetail | null>(null);
    const [loading, setLoading] = useState(true);
    const [sharingLoading, setSharingLoading] = useState(false);

    // Share preferences
    const [tableBg, setTableBg] = useState<'opaque' | 'transparent'>('opaque');
    const [shareLimit, setShareLimit] = useState<5 | 10>(5);
    const [bgType, setBgType] = useState<'gradient' | 'photo' | 'video'>('gradient');
    const [bgUri, setBgUri] = useState<string | null>(null);
    const [bgSource, setBgSource] = useState<'gradient' | 'gallery' | 'camera'>('gradient');
    const [showMediaPicker, setShowMediaPicker] = useState(true);

    const captureViewRef = useRef<View>(null);
    const stickerRef = useRef<View>(null);

    // Reanimated shared values for Table (Sticker)
    const translateX = useSharedValue(20);
    const translateY = useSharedValue(120);
    const stickerOffsetX = useSharedValue(0);
    const stickerOffsetY = useSharedValue(0);
    const stickerScale = useSharedValue(1.0);
    const stickerSavedScale = useSharedValue(1.0);

    // Reanimated shared values for Background
    const bgTranslateX = useSharedValue(0);
    const bgTranslateY = useSharedValue(0);
    const bgOffsetX = useSharedValue(0);
    const bgOffsetY = useSharedValue(0);
    const bgScale = useSharedValue(1.0);
    const bgSavedScale = useSharedValue(1.0);

    useEffect(() => {
        fetchTournamentData();
    }, [id]);

    const fetchTournamentData = async () => {
        setLoading(true);
        try {
            const data = await api.get(`/tournaments/${id}`);
            setTournament(data as TournamentDetail);
        } catch (e) {
            console.error(e);
            Alert.alert('Error', 'No se pudo cargar la información del torneo');
            router.back();
        } finally {
            setLoading(false);
        }
    };

    // Table gestures
    const stickerPanGesture = Gesture.Pan()
        .onStart(() => {
            stickerOffsetX.value = translateX.value;
            stickerOffsetY.value = translateY.value;
        })
        .onUpdate((e) => {
            translateX.value = stickerOffsetX.value + e.translationX;
            translateY.value = stickerOffsetY.value + e.translationY;
        });

    const stickerPinchGesture = Gesture.Pinch()
        .onStart(() => {
            stickerSavedScale.value = stickerScale.value;
        })
        .onUpdate((e) => {
            stickerScale.value = Math.max(0.5, Math.min(2.0, stickerSavedScale.value * e.scale));
        });

    const stickerComposedGesture = Gesture.Simultaneous(stickerPanGesture, stickerPinchGesture);

    const animatedStickerStyle = useAnimatedStyle(() => ({
        transform: [
            { translateX: translateX.value },
            { translateY: translateY.value },
            { scale: stickerScale.value },
        ],
    }));

    // Background gestures
    const bgPanGesture = Gesture.Pan()
        .minPointers(2)
        .onStart(() => {
            bgOffsetX.value = bgTranslateX.value;
            bgOffsetY.value = bgTranslateY.value;
        })
        .onUpdate((e) => {
            bgTranslateX.value = bgOffsetX.value + e.translationX;
            bgTranslateY.value = bgOffsetY.value + e.translationY;
        });

    const bgPinchGesture = Gesture.Pinch()
        .onStart(() => {
            bgSavedScale.value = bgScale.value;
        })
        .onUpdate((e) => {
            bgScale.value = Math.max(0.5, Math.min(3.0, bgSavedScale.value * e.scale));
        });

    const bgComposedGesture = Gesture.Simultaneous(bgPanGesture, bgPinchGesture);

    const animatedBgStyle = useAnimatedStyle(() => ({
        transform: [
            { translateX: bgTranslateX.value },
            { translateY: bgTranslateY.value },
            { scale: bgScale.value },
        ],
    }));

    const resetTablePosition = () => {
        translateX.value = 20;
        translateY.value = 120;
        stickerScale.value = 1.0;
        bgTranslateX.value = 0;
        bgTranslateY.value = 0;
        bgScale.value = 1.0;
    };

    const handleMediaSelect = (uri: string, type: 'image' | 'video') => {
        setBgUri(uri);
        setBgType(type === 'video' ? 'video' : 'photo');
        setBgSource('gallery');
        setShowMediaPicker(false);
    };

    const shareToInstagramStories = async () => {
        if (!stickerRef.current) return;
        if (!ShareModule || !SocialEnum) {
            Alert.alert(
                'No disponible en Expo Go',
                'Compartir directamente en Instagram Stories requiere una compilación nativa (Development Build). ¿Querés compartir la imagen usando el menú tradicional?',
                [
                    { text: 'Cancelar', style: 'cancel' },
                    { text: 'Compartir imagen', onPress: () => shareToOtherApps() }
                ]
            );
            return;
        }

        setSharingLoading(true);
        try {
            // Capture transparent sticker card
            const stickerUri = await captureRef(stickerRef, {
                format: 'png',
                quality: 1.0,
            });

            // Convert to base64
            const stickerBase64 = await FileSystem.readAsStringAsync(stickerUri, {
                encoding: 'base64',
            });

            const shareOptions: ShareSingleOptions = {
                social: SocialEnum.InstagramStories,
                stickerImage: `data:image/png;base64,${stickerBase64}`,
                backgroundImage: bgType === 'photo' && bgUri ? bgUri : undefined,
                backgroundVideo: bgType === 'video' && bgUri ? bgUri : undefined,
                backgroundTopColor: !(bgType === 'photo' || bgType === 'video') || !bgUri ? '#0F172A' : undefined,
                backgroundBottomColor: !(bgType === 'photo' || bgType === 'video') || !bgUri ? '#020617' : undefined,
                appId: '',
            };

            await ShareModule.shareSingle(shareOptions);
        } catch (error) {
            console.error('Error al compartir en Instagram Stories:', error);
            Alert.alert(
                'Compartir en Instagram',
                'No se pudo abrir Instagram. Asegurate de tener la app instalada.'
            );
        } finally {
            setSharingLoading(false);
        }
    };

    const shareToOtherApps = async () => {
        if (!captureViewRef.current) return;

        setSharingLoading(true);
        try {
            // Standard aspect ratio capturing (scales up the preview viewport to 1080x1920 dynamically)
            const PIXEL_RATIO = 3;
            const fullImageUri = await captureRef(captureViewRef, {
                format: 'png',
                quality: 1.0,
                width: CAPTURE_WIDTH * PIXEL_RATIO,
                height: CAPTURE_HEIGHT * PIXEL_RATIO,
            });

            if (ShareModule) {
                await ShareModule.open({
                    url: fullImageUri,
                    type: 'image/png',
                });
            } else {
                // Fallback for Expo Go
                const isAvailable = await Sharing.isAvailableAsync();
                if (isAvailable) {
                    await Sharing.shareAsync(fullImageUri, {
                        mimeType: 'image/png',
                        dialogTitle: 'Compartir Tabla de Posiciones',
                    });
                } else {
                    Alert.alert('Error', 'El dispositivo no admite compartir archivos.');
                }
            }
        } catch (error) {
            const err = error as Error;
            if (err && err.message && !err.message.includes('User did not share')) {
                console.error('Error al compartir:', err);
                Alert.alert('Error', 'No se pudo compartir la imagen');
            }
        } finally {
            setSharingLoading(false);
        }
    };

    if (loading) {
        return (
            <View style={[styles.container, styles.centered]}>
                <ActivityIndicator size="large" color="#EAB308" />
            </View>
        );
    }

    if (!tournament) return null;

    const members = tournament.members || [];

    return (
        <GestureHandlerRootView style={styles.container}>
            <ShareMediaPicker
                visible={showMediaPicker}
                onClose={() => {
                    if (bgUri) {
                        setShowMediaPicker(false);
                    } else {
                        router.back();
                    }
                }}
                onSelect={handleMediaSelect}
            />

            <StatusBar hidden />

            {/* Header controls (Edit Mode overlay) */}
            <View style={styles.editHeader}>
                <TouchableOpacity onPress={() => router.back()} style={styles.iconButton}>
                    <Ionicons name="arrow-back" size={24} color="#fff" />
                </TouchableOpacity>
                <TouchableOpacity onPress={resetTablePosition} style={styles.iconButton}>
                    <Ionicons name="refresh-outline" size={24} color="#fff" />
                </TouchableOpacity>
            </View>

            {/* Capture View (Story Canvas viewport) */}
            <View
                ref={captureViewRef}
                style={styles.captureView}
                collapsable={false}
            >
                <GestureDetector gesture={bgComposedGesture}>
                    <Animated.View style={styles.backgroundContainer}>
                        {bgType === 'video' && bgUri ? (
                            <Video
                                source={{ uri: bgUri }}
                                style={[styles.backgroundImage, animatedBgStyle]}
                                resizeMode={ResizeMode.COVER}
                                shouldPlay
                                isLooping
                                isMuted
                            />
                        ) : bgType === 'photo' && bgUri ? (
                            <Animated.Image
                                source={{ uri: bgUri }}
                                style={[styles.backgroundImage, animatedBgStyle]}
                                resizeMode="cover"
                            />
                        ) : (
                            <LinearGradient
                                colors={['#0F172A', '#020617']}
                                style={styles.backgroundImage}
                            />
                        )}
                    </Animated.View>
                </GestureDetector>

                {/* Leaderboard floating card (Sticker) */}
                <Animated.View style={[styles.stickerContainer, animatedStickerStyle]}>
                    <GestureDetector gesture={stickerComposedGesture}>
                        <Animated.View 
                            ref={stickerRef}
                            style={[
                                styles.floatingCard,
                                {
                                    backgroundColor: tableBg === 'opaque' ? 'rgba(15, 23, 42, 0.93)' : 'transparent',
                                    borderColor: tableBg === 'opaque' ? 'rgba(255, 255, 255, 0.1)' : 'transparent',
                                    borderWidth: tableBg === 'opaque' ? 1 : 0,
                                }
                            ]}
                        >
                            <Text style={styles.tournamentName} numberOfLines={2}>{tournament.name}</Text>
                            <Text style={styles.competitionName} numberOfLines={1}>
                                {tournament.competition?.name || 'Torneo Personalizado'}
                            </Text>

                            <View style={styles.divider} />

                            <Text style={styles.leaderboardLabel}>TABLA DE POSICIONES</Text>

                            <View style={styles.membersList}>
                                {members.slice(0, shareLimit).map((m: TournamentMember, index: number) => (
                                    <View key={m.id} style={styles.memberRow}>
                                        <Text style={[styles.memberRank, index < 3 && { color: '#EAB308' }]}>
                                            #{index + 1}
                                        </Text>
                                        {m.user?.avatarUrl ? (
                                            <Image source={{ uri: m.user.avatarUrl }} style={styles.memberAvatar} />
                                        ) : (
                                            <View style={styles.memberAvatarFallback}>
                                                <Text style={styles.memberAvatarFallbackText}>
                                                    {(m.user?.username || 'U').substring(0, 1).toUpperCase()}
                                                </Text>
                                            </View>
                                        )}
                                        <Text style={[styles.memberUsername, index === 0 && { color: '#EAB308' }]} numberOfLines={1}>
                                            {m.user?.username || 'Usuario'}
                                        </Text>
                                        <Text style={styles.memberPoints}>{m.totalPoints} pts</Text>
                                    </View>
                                ))}
                            </View>

                            <View style={styles.footerContainer}>
                                <Image source={require('../../../assets/icon.png')} style={styles.footerLogo} />
                                <Text style={styles.cardFooter}>esmiprode.com</Text>
                            </View>
                        </Animated.View>
                    </GestureDetector>
                </Animated.View>
            </View>

            {/* Bottom edit options (Floating Controls) */}
            <View style={styles.controls}>
                {/* Drag Hint at the top of controls */}
                <View style={styles.dragHint}>
                    <Ionicons name="move" size={14} color="#94A3B8" />
                    <Text style={styles.dragHintText}>Arrastrá y pellizcá con dos dedos para acomodar</Text>
                </View>

                {/* Combined settings row */}
                <View style={styles.controlGroup}>
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', gap: 12 }}>
                        {/* Adjust Limit */}
                        <View style={{ flex: 1 }}>
                            <Text style={styles.sectionLabel}>LÍMITE DE JUGADORES</Text>
                            <View style={styles.row}>
                                {[5, 10].map(limit => (
                                    <TouchableOpacity
                                        key={limit}
                                        style={[styles.chip, shareLimit === limit && styles.chipActive]}
                                        onPress={() => setShareLimit(limit as 5 | 10)}
                                    >
                                        <Text style={[styles.chipText, shareLimit === limit && styles.chipTextActive]}>
                                            Top {limit}
                                        </Text>
                                    </TouchableOpacity>
                                ))}
                            </View>
                        </View>

                        {/* Table Style */}
                        <View style={{ flex: 1 }}>
                            <Text style={styles.sectionLabel}>ESTILO DE TABLA</Text>
                            <View style={styles.row}>
                                <TouchableOpacity
                                    style={[styles.chip, tableBg === 'opaque' && styles.chipActive]}
                                    onPress={() => setTableBg('opaque')}
                                >
                                    <Text style={[styles.chipText, tableBg === 'opaque' && styles.chipTextActive]}>
                                        Opaco
                                    </Text>
                                </TouchableOpacity>

                                <TouchableOpacity
                                    style={[styles.chip, tableBg === 'transparent' && styles.chipActive]}
                                    onPress={() => setTableBg('transparent')}
                                >
                                    <Text style={[styles.chipText, tableBg === 'transparent' && styles.chipTextActive]}>
                                        Transp.
                                    </Text>
                                </TouchableOpacity>
                            </View>
                        </View>
                    </View>
                </View>

                {/* Change media source or trigger standard gradient */}
                <View style={styles.bottomRow}>
                    <TouchableOpacity
                        style={styles.changePhotoButton}
                        onPress={() => {
                            setBgType('gradient');
                            setBgUri(null);
                            setBgSource('gradient');
                        }}
                    >
                        <Ionicons name="sparkles-outline" size={24} color={bgSource === 'gradient' ? '#EAB308' : '#fff'} />
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={styles.changePhotoButton}
                        onPress={() => setShowMediaPicker(true)}
                    >
                        <Ionicons name="images-outline" size={24} color="#fff" />
                    </TouchableOpacity>

                    <TouchableOpacity
                        onPress={shareToInstagramStories}
                        disabled={sharingLoading}
                        activeOpacity={0.8}
                    >
                        <LinearGradient
                            colors={['#833AB4', '#FD1D1D', '#FCAF45']}
                            start={{ x: 0, y: 1 }}
                            end={{ x: 1, y: 0 }}
                            style={styles.instagramRoundButton}
                        >
                            {sharingLoading ? (
                                <ActivityIndicator color="#fff" />
                            ) : (
                                <Ionicons name="logo-instagram" size={24} color="#fff" />
                            )}
                        </LinearGradient>
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={styles.shareButton}
                        onPress={shareToOtherApps}
                        disabled={sharingLoading}
                    >
                        {sharingLoading ? (
                            <ActivityIndicator color="#422006" />
                        ) : (
                            <>
                                <Ionicons name="share-social-outline" size={20} color="#422006" />
                                <Text style={styles.shareButtonText}>COMPARTIR</Text>
                            </>
                        )}
                    </TouchableOpacity>
                </View>
            </View>
        </GestureHandlerRootView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#020617',
    },
    centered: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    editHeader: {
        position: 'absolute',
        top: 50,
        left: 0,
        right: 0,
        zIndex: 20,
        flexDirection: 'row',
        justifyContent: 'space-between',
        paddingHorizontal: 20,
    },
    iconButton: {
        width: 44,
        height: 44,
        borderRadius: 22,
        backgroundColor: 'rgba(15, 23, 42, 0.7)',
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.1)',
    },
    captureView: {
        width: CAPTURE_WIDTH,
        height: CAPTURE_HEIGHT,
        backgroundColor: '#000',
        alignSelf: 'center',
        overflow: 'hidden',
    },
    backgroundContainer: {
        width: '100%',
        height: '100%',
        justifyContent: 'center',
        alignItems: 'center',
    },
    backgroundImage: {
        width: CAPTURE_WIDTH,
        height: CAPTURE_HEIGHT,
    },
    stickerContainer: {
        position: 'absolute',
        width: SCREEN_WIDTH - 40,
        // Centered horizontally by default
        left: 0,
        right: 0,
    },
    floatingCard: {
        borderRadius: 24,
        padding: 20,
        width: '100%',
    },
    tournamentName: {
        fontSize: 18,
        fontWeight: '900',
        color: '#F8FAFC',
        textAlign: 'center',
        marginTop: 4,
    },
    competitionName: {
        fontSize: 11,
        color: '#94A3B8',
        textAlign: 'center',
        textTransform: 'uppercase',
        fontWeight: 'bold',
        letterSpacing: 1,
        marginTop: 2,
    },
    divider: {
        height: 1,
        backgroundColor: 'rgba(255,255,255,0.1)',
        marginVertical: 12,
        width: '60%',
        alignSelf: 'center',
    },
    leaderboardLabel: {
        fontSize: 10,
        fontWeight: '900',
        color: '#EAB308',
        letterSpacing: 2,
        textAlign: 'center',
        marginBottom: 8,
    },
    membersList: {
        gap: 8,
        marginVertical: 8,
    },
    memberRow: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(255,255,255,0.03)',
        borderRadius: 8,
        paddingHorizontal: 10,
        paddingVertical: 6,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.04)',
    },
    memberRank: {
        fontSize: 12,
        fontWeight: '900',
        color: '#94A3B8',
        width: 24,
    },
    memberAvatar: {
        width: 20,
        height: 20,
        borderRadius: 10,
        marginRight: 8,
    },
    memberAvatarFallback: {
        width: 20,
        height: 20,
        borderRadius: 10,
        backgroundColor: '#334155',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 8,
    },
    memberAvatarFallbackText: {
        color: '#F8FAFC',
        fontSize: 10,
        fontWeight: 'bold',
    },
    memberUsername: {
        fontSize: 12,
        fontWeight: '600',
        color: '#F8FAFC',
        flex: 1,
    },
    memberPoints: {
        fontSize: 12,
        fontWeight: '900',
        color: '#F8FAFC',
    },
    footerContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: 12,
    },
    footerLogo: {
        width: 14,
        height: 14,
        marginRight: 6,
        borderRadius: 3,
    },
    cardFooter: {
        fontSize: 9,
        fontWeight: '700',
        color: '#64748B',
        letterSpacing: 1.5,
    },
    controls: {
        position: 'absolute',
        bottom: 30,
        left: 0,
        right: 0,
        gap: 16,
        paddingHorizontal: 20,
        alignItems: 'center',
    },
    controlGroup: {
        width: '100%',
        backgroundColor: '#0F172A',
        padding: 12,
        borderRadius: 16,
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.1)',
    },
    sectionLabel: {
        fontSize: 10,
        fontWeight: '900',
        color: '#64748B',
        letterSpacing: 1.5,
        marginBottom: 8,
        textAlign: 'center',
    },
    row: {
        flexDirection: 'row',
        gap: 10,
    },
    chip: {
        flex: 1,
        backgroundColor: '#1E293B',
        paddingVertical: 8,
        borderRadius: 10,
        alignItems: 'center',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.05)',
    },
    chipActive: {
        borderColor: '#EAB308',
        backgroundColor: 'rgba(234, 179, 8, 0.1)',
    },
    chipText: {
        color: '#94A3B8',
        fontSize: 11,
        fontWeight: '600',
    },
    chipTextActive: {
        color: '#EAB308',
        fontWeight: 'bold',
    },
    bottomRow: {
        flexDirection: 'row',
        width: '100%',
        gap: 12,
        alignItems: 'center',
    },
    changePhotoButton: {
        width: 50,
        height: 50,
        borderRadius: 25,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#0F172A',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.1)',
    },
    instagramRoundButton: {
        width: 50,
        height: 50,
        borderRadius: 25,
        justifyContent: 'center',
        alignItems: 'center',
        overflow: 'hidden',
    },
    shareButton: {
        flex: 1,
        height: 50,
        backgroundColor: '#EAB308',
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        borderRadius: 25,
        gap: 6,
    },
    shareButtonText: {
        color: '#422006',
        fontWeight: '900',
        fontSize: 12,
        letterSpacing: 0.5,
    },
    dragHint: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        backgroundColor: '#0F172A',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 16,
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.1)',
    },
    dragHintText: {
        fontSize: 10,
        color: '#94A3B8',
        fontWeight: '500',
    },
});
