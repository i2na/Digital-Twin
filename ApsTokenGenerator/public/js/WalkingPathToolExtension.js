(function () {
    class DrawWalkingPathLinesToolContextMenu extends Autodesk.Viewing.Extensions
        .ViewerObjectContextMenu {
        constructor(tool) {
            super(tool.viewer);

            this.tool = tool;
        }

        buildMenu(event, status) {
            if (!this.viewer.model) {
                return;
            }

            let menu = null;
            if (!this.tool.active) {
                menu = super.buildMenu(event, status);
            } else {
                menu = [];
                menu.push({
                    title: "Complete Walking Path",
                    target: () => {
                        this.tool.completeDrawing();
                    },
                });
            }

            menu.push({
                title: "Clear Walking Paths",
                target: () => {
                    this.tool.clearScene();
                },
            });

            return menu;
        }
    }

    const DrawWalkingPathLinesToolName = "draw-walking-path-lines-tool";
    const DrawWalkingPathLinesOverlayName = "draw-walking-path-lines-overlay";

    class DrawWalkingPathLinesTool extends Autodesk.Viewing.ToolInterface {
        constructor(viewer) {
            super();
            this.viewer = viewer;
            this.names = [DrawWalkingPathLinesToolName];
            this.active = false;
            this.snapper = null;
            this.lineMaterial = new THREE.LineBasicMaterial({
                color: 0xee0000,
                transparent: true,
                side: THREE.DoubleSide,
                depthTest: false,
                depthWrite: false,
                blending: THREE.NoBlending,
            });
            this.currentPoints = [];
            this.lastPathPoints = [];
            this.currentMesh = null;
            this.intermediatePoint = null;
            // Hack: delete functions defined on the *instance* of a ToolInterface (we want the tool controller to call our class methods instead)
            delete this.register;
            delete this.deregister;
            delete this.activate;
            delete this.deactivate;
            delete this.getPriority;
            delete this.handleMouseMove;
            delete this.handleSingleClick;
            delete this.handleKeyUp;
        }

        register() {
            this.viewer.setContextMenu(new DrawWalkingPathLinesToolContextMenu(this));
            this.snapper = new Autodesk.Viewing.Extensions.Snapping.Snapper(this.viewer, {
                /*renderSnappedGeometry: true,*/ renderSnappedTopology: true,
            });
            //this.snapper.setSnapToPixel(true); // Provide intersection even when we haven't snapped to any geometry
            this.viewer.toolController.registerTool(this.snapper);
            this.viewer.toolController.activateTool(this.snapper.getName());
            console.log("DrawWalkingPathLinesTool registered.");
        }

        deregister() {
            this.viewer.setDefaultContextMenu();
            this.viewer.toolController.deactivateTool(this.snapper.getName());
            this.viewer.toolController.deregisterTool(this.snapper);
            this.snapper = null;
            console.log("DrawWalkingPathLinesTool unregistered.");
        }

        createScene() {
            if (!this.viewer.overlays.hasScene(DrawWalkingPathLinesOverlayName))
                this.viewer.overlays.addScene(DrawWalkingPathLinesOverlayName);
        }

        clearScene() {
            this._reset();

            if (this.viewer.overlays.hasScene(DrawWalkingPathLinesOverlayName))
                this.viewer.overlays.clearScene(DrawWalkingPathLinesOverlayName);
        }

        removeScene() {
            this._reset();

            if (this.viewer.overlays.hasScene(DrawWalkingPathLinesOverlayName))
                this.viewer.overlays.removeScene(DrawWalkingPathLinesOverlayName);
        }

        activate(name, viewer) {
            if (!this.active) {
                this.createScene();
                console.log("DrawWalkingPathLinesTool activated.");
                this.active = true;
            }
        }

        deactivate(name) {
            if (this.active) {
                console.log("DrawWalkingPathLinesTool deactivated.");
                this._reset();
                this.active = false;
            }
        }

        getPriority() {
            return 99; // Feel free to use any number higher than 0 (which is the priority of all the default viewer tools)
        }

        handleMouseMove(event) {
            if (!this.active) {
                return false;
            }
            // If we placed some lines already, try to infer the endpoint of the next one based on the current mouse position
            this.snapper.indicator.clearOverlays();
            if (this.snapper.isSnapped()) {
                const result = this.snapper.getSnapResult();

                const { SnapType } = Autodesk.Viewing.MeasureCommon;
                switch (result.geomType) {
                    case SnapType.SNAP_VERTEX:
                    case SnapType.SNAP_MIDPOINT:
                    case SnapType.SNAP_INTERSECTION:
                    case SnapType.SNAP_CIRCLE_CENTER:
                    case SnapType.RASTER_PIXEL:
                    case SnapType.SNAP_FACE:
                    case SnapType.SNAP_CURVEDFACE:
                        // console.log('Snapped to vertex', result.geomVertex);
                        this.snapper.indicator.render(); // Show indicator when snapped to a vertex
                        if (this.currentPoints.length != 0) {
                            this.intermediatePoint = result.intersectPoint.clone();
                            this._updateCurrentMesh();
                        }
                        break;
                    case SnapType.SNAP_EDGE:
                    case SnapType.SNAP_CIRCULARARC:
                    case SnapType.SNAP_CURVEDEDGE:
                        // console.log('Snapped to edge', result.geomEdge);
                        break;
                    // case SnapType.SNAP_FACE:
                    // case SnapType.SNAP_CURVEDFACE:
                    //     // console.log('Snapped to face', result.geomFace);
                    //     break;
                }
            }
            return false;
        }

        handleSingleClick(event, button) {
            if (!this.active) {
                return false;
            }
            if (button === 0 && this.snapper.isSnapped()) {
                const result = this.snapper.getSnapResult();

                const { SnapType } = Autodesk.Viewing.MeasureCommon;
                switch (result.geomType) {
                    case SnapType.SNAP_VERTEX:
                    case SnapType.SNAP_MIDPOINT:
                    case SnapType.SNAP_INTERSECTION:
                    case SnapType.SNAP_CIRCLE_CENTER:
                    case SnapType.RASTER_PIXEL:
                    case SnapType.SNAP_FACE:
                    case SnapType.SNAP_CURVEDFACE:
                        if (this.currentPoints.length === 0) {
                            this.currentPoints.push(result.intersectPoint.clone());
                        } else {
                            this.currentPoints.push(this.intermediatePoint);
                        }
                        this._updateCurrentMesh();
                        break;
                    default:
                        // Do not snap to other types
                        break;
                }

                return true; // Stop the event from going to other tools in the stack
            }
            return false;
        }

        handleKeyUp(event, keyCode) {
            if (this.active) {
                if (keyCode === 27) {
                    this._reset();
                    return true;
                }
            }
            return false;
        }

        _updateCurrentMesh() {
            if (this.currentMesh) {
                this.viewer.overlays.removeMesh(this.currentMesh, DrawWalkingPathLinesOverlayName);
                this.currentMesh = null;
            }
            if (this.currentPoints.length > 0) {
                const points = this.currentPoints.slice();
                if (this.intermediatePoint) {
                    points.push(this.intermediatePoint);
                }
                this.currentMesh = this._createLineMesh(points);
                this.viewer.overlays.addMesh(this.currentMesh, DrawWalkingPathLinesOverlayName);
            }
        }

        _createLineMesh(points, radius = 0.07) {
            const group = new THREE.Group();

            // 원통 1개 geometry/재질 미리 생성
            const cylGeo = new THREE.CylinderGeometry(radius, radius, 1, 12, 1, true);
            const cylMat = new THREE.MeshBasicMaterial({
                color: 0x77f9fe, // 선명한 빨간
                transparent: true,
                opacity: 0.9,
                depthTest: false,
                depthWrite: false,
            });

            for (let i = 0; i < points.length - 1; i++) {
                const p1 = points[i],
                    p2 = points[i + 1];
                const dir = new THREE.Vector3().subVectors(p2, p1);
                const len = dir.length();
                if (len < 1e-6) continue;

                // 중간 지점
                const mid = new THREE.Vector3().addVectors(p1, p2).multiplyScalar(0.5);

                // 원통 메쉬 복제 & 길이 맞춰 스케일
                const mesh = new THREE.Mesh(cylGeo, cylMat);
                mesh.scale.set(1, len, 1);

                // y축→dir 회전
                mesh.quaternion.setFromUnitVectors(
                    new THREE.Vector3(0, 1, 0),
                    dir.clone().normalize()
                );

                // 위치 지정
                mesh.position.copy(mid);

                group.add(mesh);
            }

            return group;
        }

        completeDrawing() {
            this.lastPathPoints = this.currentPoints.slice();
            this._reset();
        }

        _reset() {
            this.currentMesh = null;
            this.currentPoints = [];
            this.intermediatePoint = null;

            this.snapper.indicator.clearOverlays();
        }

        extractLastPathPoints() {
            return Array.isArray(this.lastPathPoints) ? this.lastPathPoints.slice() : [];
        }
    }

    class WalkingPathToolExtension extends Autodesk.Viewing.Extension {
        constructor(viewer, options) {
            super(viewer, options);
            this.tool = new DrawWalkingPathLinesTool(viewer);
            this.cameraTweenTool = null;
        }

        async load() {
            await this.viewer.loadExtension("Autodesk.Snapping");
            await this.viewer.loadExtension("Autodesk.BimWalk");
            this.viewer.setBimWalkToolPopup(false);

            this.cameraTweenTool = await this.viewer.loadExtension("Autodesk.ADN.CameraTweenTool");

            this.viewer.toolController.registerTool(this.tool);

            console.log("WalkingPathToolExtension has been loaded.");
            return true;
        }

        async unload() {
            this.viewer.unloadExtension("Autodesk.ADN.CameraTweenTool");
            this.viewer.setBimWalkToolPopup(true);
            this.tool.removeScene();
            this.viewer.toolController.deregisterTool(this.tool);

            delete this.cameraTweenTool;
            this.cameraTweenTool = null;

            console.log("WalkingPathToolExtension has been unloaded.");
            return true;
        }

        pathPointsToViews() {
            const points = this.tool.extractLastPathPoints();
            if (points.length < 2) {
                alert("먼저 “Complete Walking Path” 메뉴로 경로를 확정하세요.");
                return [];
            }
            const views = [];
            const up = new THREE.Vector3(0, 0, 1);
            for (let i = 0; i < points.length - 1; i++) {
                const dir = points[i + 1].clone().sub(points[i]).normalize();
                const pos = points[i].clone().add(up.clone().multiplyScalar(1.7 * 3.2808399));
                const eyeLen = this.viewer.navigation.getEyeVector().length();
                const target = pos.clone().add(dir.clone().multiplyScalar(eyeLen));
                views.push({
                    up: up.toArray(),
                    eye: pos.toArray(),
                    target: target.toArray(),
                });
            }

            const lastView = views[views.length - 1];
            const lastEye = new THREE.Vector3().fromArray(lastView.eye);
            const lastTarget = new THREE.Vector3().fromArray(lastView.target);
            const lastSightVector = lastTarget.clone().sub(lastEye);
            const lastEyeLen = lastSightVector.length();
            const lastDir = lastSightVector.normalize();

            const fixedLastEye = points[points.length - 1]
                .clone()
                .add(up.clone().multiplyScalar(1.7 * 3.2808399))
                .add(lastDir.clone().multiplyScalar(1));
            const fixedLastTarget = fixedLastEye
                .clone()
                .add(lastDir.clone().multiplyScalar(lastEyeLen));

            views.push({
                up: up.toArray(),
                eye: fixedLastEye.toArray(),
                target: fixedLastTarget.toArray(),
            });

            return views;
        }

        executeTweenPromised(view) {
            return new Promise((resolve, reject) => {
                const onTweenExecuted = (event) => {
                    console.log(event);
                    this.viewer.removeEventListener(
                        Autodesk.ADN.CameraTweenTool.CAMERA_TWEEN_ANIMATION_COMPLETED_EVENT,
                        onTweenExecuted
                    );

                    resolve();
                };

                this.viewer.addEventListener(
                    Autodesk.ADN.CameraTweenTool.CAMERA_TWEEN_ANIMATION_COMPLETED_EVENT,
                    onTweenExecuted
                );

                this.cameraTweenTool.tweenCameraTo({ viewport: view });
            });
        }

        processTweens(data) {
            //process each promise
            //refer to http://jsfiddle.net/jfriend00/h3zaw8u8/
            const promisesInSequence = (tasks, callback) => {
                const results = [];
                return tasks.reduce((p, item) => {
                    return p.then(() => {
                        return callback(item).then((data) => {
                            results.push(data);
                            return results;
                        });
                    });
                }, Promise.resolve());
            };

            //start to process
            return promisesInSequence(data, (d) => this.executeTweenPromised(d));
        }

        pauseTweens() {
            this.cameraTweenTool.pauseAnimation();
        }

        resumeTweens() {
            this.cameraTweenTool.resumeAnimation();
        }

        onToolbarCreated(toolbar) {
            const controller = this.viewer.toolController;
            const drawWalkingPathButton = new Autodesk.Viewing.UI.Button(
                "draw-walking-path-lines-tool-button"
            );
            drawWalkingPathButton.onClick = (ev) => {
                if (controller.isToolActivated(DrawWalkingPathLinesToolName)) {
                    controller.deactivateTool(DrawWalkingPathLinesToolName);
                    drawWalkingPathButton.setState(Autodesk.Viewing.UI.Button.State.INACTIVE);
                } else {
                    controller.activateTool(DrawWalkingPathLinesToolName);
                    drawWalkingPathButton.setState(Autodesk.Viewing.UI.Button.State.ACTIVE);
                }
            };
            drawWalkingPathButton.setToolTip("Draw Walking Path Lines");

            const walkNavButton = new Autodesk.Viewing.UI.Button("walking-navigation-button");
            walkNavButton.onClick = async () => {
                this.viewer.setActiveNavigationTool("bimwalk");
                const views = this.pathPointsToViews();
                if (!views.length) return;
                await this.processTweens(views);
            };

            walkNavButton.setToolTip("Play Walking Path");

            this.group = new Autodesk.Viewing.UI.ControlGroup("walking-path-tool-group");
            this.group.addControl(drawWalkingPathButton);
            this.group.addControl(walkNavButton);
            toolbar.addControl(this.group);
        }
    }

    Autodesk.Viewing.theExtensionManager.registerExtension(
        "Autodesk.ADN.WalkingPathToolExtension",
        WalkingPathToolExtension
    );
})();

(function () {
    const EASINGS = [
        {
            id: TWEEN.Easing.Linear.None,
            name: "Linear",
        },

        {
            id: TWEEN.Easing.Quadratic.In,
            name: "Quadratic.In",
        },
        {
            id: TWEEN.Easing.Quadratic.Out,
            name: "Quadratic.Out",
        },
        {
            id: TWEEN.Easing.Quadratic.InOut,
            name: "Quadratic.InOut",
        },

        {
            id: TWEEN.Easing.Cubic.In,
            name: "Cubic.In",
        },
        {
            id: TWEEN.Easing.Cubic.Out,
            name: "Cubic.Out",
        },
        {
            id: TWEEN.Easing.Cubic.InOut,
            name: "Cubic.InOut",
        },

        {
            id: TWEEN.Easing.Quartic.In,
            name: "Quartic.In",
        },
        {
            id: TWEEN.Easing.Quartic.Out,
            name: "Quartic.Out",
        },
        {
            id: TWEEN.Easing.Quartic.InOut,
            name: "Quartic.InOut",
        },

        {
            id: TWEEN.Easing.Quintic.In,
            name: "Quintic.In",
        },
        {
            id: TWEEN.Easing.Quintic.Out,
            name: "Quintic.Out",
        },
        {
            id: TWEEN.Easing.Quintic.InOut,
            name: "Quintic.InOut",
        },

        {
            id: TWEEN.Easing.Exponential.In,
            name: "Exponential.In",
        },
        {
            id: TWEEN.Easing.Exponential.Out,
            name: "Exponential.Out",
        },
        {
            id: TWEEN.Easing.Exponential.InOut,
            name: "Exponential.InOut",
        },
    ];

    const CAMERA_TWEEN_ANIMATION_COMPLETED_EVENT = "AdnCameraTweenAnimationCompleted";

    class CameraTweenToolExtension extends Autodesk.Viewing.Extension {
        constructor(viewer, options) {
            super(viewer, options);

            this.targetTweenDuration = 4500;
            this.posTweenDuration = 4500;
            this.upTweenDuration = 4500;
            this.tweens = [];

            this.targetTweenEasing = this.getTweenEasingByName("Linear");
            this.posTweenEasing = this.getTweenEasingByName("Linear");
            this.upTweenEasing = this.getTweenEasingByName("Linear");

            this.runAnimation = this.runAnimation.bind(this);
        }

        get supportedTweenEasings() {
            return EASINGS.concat();
        }

        getTweenEasingByName(name) {
            return EASINGS.find((es) => es.name === name);
        }

        createTween(params) {
            return new Promise((resolve) => {
                const tween = new TWEEN.Tween(params.object)
                    .to(params.to, params.duration)
                    .onComplete(() => resolve())
                    .onUpdate(params.onUpdate)
                    .easing(params.easing)
                    .start();

                this.tweens.push(tween);
            });
        }

        tweenCameraTo(state, immediate) {
            const targetEnd = new THREE.Vector3(
                state.viewport.target[0],
                state.viewport.target[1],
                state.viewport.target[2]
            );

            const posEnd = new THREE.Vector3(
                state.viewport.eye[0],
                state.viewport.eye[1],
                state.viewport.eye[2]
            );

            const upEnd = new THREE.Vector3(
                state.viewport.up[0],
                state.viewport.up[1],
                state.viewport.up[2]
            );

            const nav = this.viewer.navigation;
            const target = new THREE.Vector3().copy(nav.getTarget());
            const pos = new THREE.Vector3().copy(nav.getPosition());
            const up = new THREE.Vector3().copy(nav.getCameraUpVector());

            const targetTween = this.createTween({
                easing: this.targetTweenEasing.id,
                onUpdate: (v) => {
                    nav.setTarget(v);
                },
                duration: immediate ? 0 : this.targetTweenDuration,
                object: target,
                to: targetEnd,
            });

            const posTween = this.createTween({
                easing: this.posTweenEasing.id,
                onUpdate: (v) => {
                    nav.setPosition(v);
                },
                duration: immediate ? 0 : this.posTweenDuration,
                object: pos,
                to: posEnd,
            });

            const upTween = this.createTween({
                easing: this.upTweenEasing.id,
                onUpdate: (v) => {
                    nav.setCameraUpVector(v);
                },
                duration: immediate ? 0 : this.upTweenDuration,
                object: up,
                to: upEnd,
            });

            Promise.all([targetTween, posTween, upTween]).then(() => {
                this.stopAnimation();

                this.viewer.fireEvent({
                    type: CAMERA_TWEEN_ANIMATION_COMPLETED_EVENT,
                    status: "completed",
                });
            });

            this.startAnimation();
        }

        stopAnimation() {
            this.animate = false;
            while (this.tweens.length > 0) {
                this.tweens.pop();
            }

            if (this.animId) window.cancelAnimationFrame(this.animId);
        }

        pauseAnimation() {
            this.animate = false;
            this.tweens.forEach((t) => t.pause());
        }

        resumeAnimation() {
            this.animate = true;
            this.tweens.forEach((t) => t.resume());
        }

        startAnimation() {
            this.animate = true;
            this.runAnimation();
        }

        toggleAnimation() {
            if (this.animate) {
                this.pauseAnimation();
            } else {
                this.resumeAnimation();
            }
        }

        runAnimation() {
            this.animId = window.requestAnimationFrame(this.runAnimation);

            if (this.animate) {
                TWEEN.update();
            }
        }

        getState(viewerState) {
            const viewport = Object.assign({}, viewerState.viewport, {});

            viewerState.cameraTween = {
                viewport,
            };
        }

        restoreState(viewerState, immediate) {
            if (!viewerState.cameraTween) return;

            this.tweenCameraTo(viewerState.cameraTween, immediate);
        }

        load() {
            console.log("CameraTweenToolExtension has been loaded.");
            return true;
        }

        unload() {
            if (this.animId) {
                window.cancelAnimationFrame(this.animId);
            }

            console.log("CameraTweenToolExtension has been unloaded.");
            return true;
        }
    }

    AutodeskNamespace("Autodesk.ADN.CameraTweenTool");
    Autodesk.ADN.CameraTweenTool.CAMERA_TWEEN_ANIMATION_COMPLETED_EVENT =
        CAMERA_TWEEN_ANIMATION_COMPLETED_EVENT;

    Autodesk.Viewing.theExtensionManager.registerExtension(
        "Autodesk.ADN.CameraTweenTool",
        CameraTweenToolExtension
    );
})();
