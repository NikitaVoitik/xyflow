export default {
  flowProps: {
    autoPanOnNodeDrag: false,
    nodeDragThreshold: 5,
    nodes: [{ id: 'drag-blur', position: { x: 200, y: 200 }, data: { label: 'Drag me' } }],
    edges: [],
    onNodeDragStart: () => {
      document.body.dataset.dragStarts = String(Number(document.body.dataset.dragStarts ?? 0) + 1);
    },
    onNodeDragStop: (_, node) => {
      document.body.dataset.dragStops = String(Number(document.body.dataset.dragStops ?? 0) + 1);
      document.body.dataset.stoppedNode = JSON.stringify({ position: node.position, dragging: node.dragging });
    },
  },
} satisfies FlowConfig;
