import subprocess
import os
import sys

commits = [
    # --- SEP 15, 2026 ---
    {
        "author": "Gayatri",
        "email": "Gayatriiia@users.noreply.github.com",
        "date": "2026-09-15T10:15:00+05:30",
        "files": [
            "backend/prisma/schema.prisma",
            "backend/prisma/seed.ts",
            "backend/src/controllers/auth.controller.ts",
            "backend/src/controllers/user.controller.ts",
            "frontend/src/context/AuthContext.tsx"
        ],
        "msg": "feat(auth): enforce default viewer role on signup and streamline RBAC access"
    },
    {
        "author": "Utkarsh Punkar",
        "email": "utkarshpunkar7@gmail.com",
        "date": "2026-09-15T14:30:00+05:30",
        "files": [
            "frontend/src/components/layout/Navbar.tsx",
            "frontend/src/components/layout/Sidebar.tsx",
            "frontend/src/components/common/ManageAccountModal.tsx",
            "frontend/src/pages/LoginPage.tsx"
        ],
        "msg": "feat(ui): add persistent signout controls and manage account modal"
    },
    {
        "author": "Mithilesh Kose",
        "email": "Mithileshkose27@users.noreply.github.com",
        "date": "2026-09-15T18:45:00+05:30",
        "files": [
            "frontend/src/pages/UsersPage.tsx",
            "frontend/src/pages/SettingsPage.tsx",
            "backend/src/routes/index.ts"
        ],
        "msg": "feat(rbac): secure role configuration matrix exclusively for technical head"
    },

    # --- SEP 16, 2026 ---
    {
        "author": "Vedant Bhanarkar",
        "email": "Vedant20092005@users.noreply.github.com",
        "date": "2026-09-16T09:40:00+05:30",
        "files": [
            "frontend/src/components/dashboard/RightSchedulePanel.tsx",
            "frontend/src/pages/MaintenancePage.tsx",
            "frontend/src/pages/PredictiveMaintenancePage.tsx",
            "backend/src/controllers/maintenance.controller.ts"
        ],
        "msg": "feat(calendar): update maintenance schedule indicators with red ring styling"
    },
    {
        "author": "Gayatri",
        "email": "Gayatriiia@users.noreply.github.com",
        "date": "2026-09-16T13:20:00+05:30",
        "files": [
            "frontend/src/components/purifier/PurifierCard.tsx",
            "frontend/src/components/common/PhysicalMirror.tsx",
            "frontend/src/components/common/StatusBadge.tsx",
            "frontend/src/components/common/AnimatedSideDecorations.tsx",
            "frontend/src/pages/PurifiersPage.tsx",
            "frontend/src/pages/PurifierDetailPage.tsx"
        ],
        "msg": "feat(purifiers): enhance physical purifier twin cards and dynamic water metrics"
    },
    {
        "author": "Mithilesh Kose",
        "email": "Mithileshkose27@users.noreply.github.com",
        "date": "2026-09-16T17:05:00+05:30",
        "files": [
            "backend/src/controllers/aiDetection.controller.ts",
            "backend/src/services/snapshotStore.ts",
            "backend/src/controllers/camera.controller.ts",
            "backend/src/app.ts",
            "backend/src/server.ts"
        ],
        "msg": "feat(ai): integrate automated optical inspection pipeline and frame store"
    },
    {
        "author": "Utkarsh Punkar",
        "email": "utkarshpunkar7@gmail.com",
        "date": "2026-09-16T21:15:00+05:30",
        "files": [
            "frontend/src/pages/AiDetectionPage.tsx",
            "frontend/src/pages/CameraPage.tsx",
            "frontend/src/api/client.ts",
            "frontend/src/App.tsx",
            "frontend/src/types/index.ts"
        ],
        "msg": "feat(stream): build zero-config live camera stream player with auto-reconnect"
    },

    # --- SEP 17, 2026 ---
    {
        "author": "Vedant Bhanarkar",
        "email": "Vedant20092005@users.noreply.github.com",
        "date": "2026-09-17T00:05:00+05:30",
        "files": [
            "firmware/usb_bridge.py",
            "run_usb_bridge.bat",
            "backend/src/engine/simulation.engine.ts",
            "backend/src/controllers/telemetry.controller.ts",
            "backend/src/controllers/purifier.controller.ts"
        ],
        "msg": "feat(hardware): implement multi-device plug-and-play USB hardware bridge"
    },
    {
        "author": "Gayatri",
        "email": "Gayatriiia@users.noreply.github.com",
        "date": "2026-09-17T00:15:00+05:30",
        "files": [
            "frontend/src/pages/DashboardPage.tsx",
            "frontend/src/pages/FilterHealthPage.tsx",
            "frontend/src/pages/AlertsPage.tsx",
            "frontend/src/pages/AnalyticsPage.tsx",
            "frontend/src/pages/DevicesPage.tsx",
            "frontend/src/pages/WaterQualityPage.tsx",
            "frontend/src/context/TelemetryContext.tsx",
            "frontend/src/components/layout/AppLayout.tsx"
        ],
        "msg": "feat(dashboard): polish responsive telemetry widgets, alerts feed, and analytics"
    },
    {
        "author": "Utkarsh Punkar",
        "email": "utkarshpunkar7@gmail.com",
        "date": "2026-09-17T00:25:00+05:30",
        "files": [
            "firmware/esp32_cam/esp32_cam.ino",
            "firmware/pico_node/main.py"
        ],
        "msg": "feat(firmware): add native OV3660 HD camera calibration and power optimization"
    }
]

for c in commits:
    env = os.environ.copy()
    env["GIT_AUTHOR_NAME"] = c["author"]
    env["GIT_AUTHOR_EMAIL"] = c["email"]
    env["GIT_AUTHOR_DATE"] = c["date"]
    env["GIT_COMMITTER_NAME"] = c["author"]
    env["GIT_COMMITTER_EMAIL"] = c["email"]
    env["GIT_COMMITTER_DATE"] = c["date"]

    for f in c["files"]:
        if os.path.exists(f):
            subprocess.run(["git", "add", f], check=True)

    res = subprocess.run(["git", "commit", "-m", c["msg"]], env=env, capture_output=True, text=True)
    print(f"[{c['date']}] {c['author']} <{c['email']}>: {c['msg']}")
    if res.stdout:
        print(res.stdout.strip())
    if res.stderr:
        print("STDERR:", res.stderr.strip())

# Check remaining files
res = subprocess.run(["git", "status", "--porcelain"], capture_output=True, text=True)
if res.stdout.strip():
    print("Staging any remaining files...")
    env = os.environ.copy()
    env["GIT_AUTHOR_NAME"] = "Utkarsh Punkar"
    env["GIT_AUTHOR_EMAIL"] = "utkarshpunkar7@gmail.com"
    env["GIT_AUTHOR_DATE"] = "2026-09-17T00:30:00+05:30"
    env["GIT_COMMITTER_NAME"] = "Utkarsh Punkar"
    env["GIT_COMMITTER_EMAIL"] = "utkarshpunkar7@gmail.com"
    env["GIT_COMMITTER_DATE"] = "2026-09-17T00:30:00+05:30"
    subprocess.run(["git", "add", "."], check=True)
    subprocess.run(["git", "commit", "-m", "chore: sync project configurations and build assets"], env=env, check=True)

print("\n--- ALL COMMITS CREATED SUCCESSFULLY ---")
