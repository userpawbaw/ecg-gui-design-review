"""Hand video → per-frame 3D hand landmarks (MediaPipe Hand Landmarker, Apache 2.0) → finger joint flexion angles (D-052).

Usage: python extract-hand-angles.py <video> <hand_landmarker.task> <out.json>
Angles use MediaPipe *world* landmarks (metres, hand-centred), so they do not depend on the camera distance.
Flexion = 180° − angle between the two segments meeting at the joint (0 = straight). The raw video stays out of the repo.
"""
import json, os, sys
import cv2, numpy as np, mediapipe as mp
from mediapipe.tasks.python import vision, BaseOptions

FING = {'thumb': (1, 2, 3, 4), 'index': (5, 6, 7, 8), 'middle': (9, 10, 11, 12), 'ring': (13, 14, 15, 16), 'pinky': (17, 18, 19, 20)}

def ang(a, b, c):
    u, v = a - b, c - b
    return 180 - np.degrees(np.arccos(np.clip(u @ v / (np.linalg.norm(u) * np.linalg.norm(v) + 1e-9), -1, 1)))

def angles(W):
    out = {}
    for f, (m, p, d, t) in FING.items():
        root = W[0] if f != 'thumb' else W[0]
        out[f] = [ang(root, W[m], W[p]), ang(W[m], W[p], W[d]), ang(W[p], W[d], W[t])]   # MCP, PIP, DIP (thumb: CMC-ish, MCP, IP)
    # spread: angle between index and pinky proximal phalanges
    out['spread'] = float(np.degrees(np.arccos(np.clip(np.dot(*(x / np.linalg.norm(x) for x in (W[6] - W[5], W[18] - W[17]))), -1, 1))))
    # thumb tip distance to the index middle phalanx (fist: thumb over index/middle), metres
    out['thumb_tip_idx_mid'] = float(np.linalg.norm(W[4] - (W[6] + W[7]) / 2))
    out['tips_to_palm'] = float(np.mean([np.linalg.norm(W[i] - (W[0] + W[9]) / 2) for i in (8, 12, 16, 20)]))
    return out

def main(video, model, out):
    cap = cv2.VideoCapture(video); fps = cap.get(cv2.CAP_PROP_FPS)
    det = vision.HandLandmarker.create_from_options(vision.HandLandmarkerOptions(
        base_options=BaseOptions(model_asset_path=model), running_mode=vision.RunningMode.VIDEO, num_hands=1,
        min_hand_detection_confidence=.4, min_tracking_confidence=.4))
    frames, i = [], 0
    while True:
        ok, img = cap.read()
        if not ok: break
        r = det.detect_for_video(mp.Image(image_format=mp.ImageFormat.SRGB, data=cv2.cvtColor(img, cv2.COLOR_BGR2RGB)), int(i * 1000 / fps))
        rec = {'i': i, 't': round(i / fps, 4)}
        if r.hand_world_landmarks:
            W = np.array([[p.x, p.y, p.z] for p in r.hand_world_landmarks[0]])
            L = np.array([[p.x, p.y, p.z] for p in r.hand_landmarks[0]])
            rec.update(angles(W)); rec['hand'] = r.handedness[0][0].category_name; rec['score'] = round(r.handedness[0][0].score, 3)
            rec['img'] = L[:, :2].round(4).tolist(); rec['world'] = W.round(5).tolist()
        frames.append(rec); i += 1
    json.dump({'fps': fps, 'size': [int(cap.get(3)), int(cap.get(4))], 'frames': frames}, open(out, 'w', encoding='utf-8'))
    print('frames', i, 'fps', round(fps, 2), 'detected', sum('index' in f for f in frames), flush=True)
    det.close(); os._exit(0)

if __name__ == '__main__': main(*sys.argv[1:4])
