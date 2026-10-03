export default {
	flowProps: {
		autoPanOnNodeDrag: false,
		nodeDragThreshold: 5,
		nodes: [{ id: 'drag-blur', position: { x: 200, y: 200 }, data: { label: 'Drag me' } }],
		edges: [],
		onnodedragstart: () => {
			document.body.dataset.dragStarts = String(Number(document.body.dataset.dragStarts ?? 0) + 1);
		},
		onnodedragstop: ({ targetNode }) => {
			document.body.dataset.dragStops = String(Number(document.body.dataset.dragStops ?? 0) + 1);
			document.body.dataset.stoppedNode = JSON.stringify({
				position: targetNode?.position,
				dragging: targetNode?.dragging
			});
		}
	}
} satisfies FlowConfig;
