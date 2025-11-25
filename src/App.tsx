import { CanvasPanel, SimpleViewerProvider } from "react-iiif-vault";
import "@atlas-viewer/atlas";
import { type Column, ReactGrid, type Row } from "@silevis/reactgrid";
import "@silevis/reactgrid/styles.css";
import type { Runtime } from "@atlas-viewer/atlas";
import { useCallback, useMemo, useRef, useState } from "react";

interface RowData {
	localName: string;
	plotNumber: string;
	refPart: string;
	refNumber: string;
	ownerName: string;
	ownerSurname: string;
	ownerOccupation: string;
	ownerResidences: string;
	articlesOfList: string;
	kindOfProperty: string;
}

const getRowData = (): RowData[] =>
	Array.from({ length: 79 }, (_, i) => ({
		localName: `name ${i}`,
		plotNumber: "",
		refPart: "",
		refNumber: "",
		ownerName: "",
		ownerSurname: "",
		ownerOccupation: "",
		ownerResidences: "",
		articlesOfList: "",
		kindOfProperty: "",
	}));

const getColumns = (): Column[] => [
	{ columnId: "localName" },
	{ columnId: "plotNumber" },
	{ columnId: "refPart" },
	{ columnId: "refNumber" },
	{ columnId: "ownerName" },
	{ columnId: "ownerSurname" },
	{ columnId: "ownerOccupation" },
	{ columnId: "ownerResidences" },
	{ columnId: "articlesOfList" },
	{ columnId: "kindOfProperty" },
];

const headerRow: Row = {
	rowId: "header",
	cells: [
		{ type: "header", text: "Local name" },
		{ type: "header", text: "Plot number" },
		{ type: "header", text: "Ref Part" },
		{ type: "header", text: "Ref Number" },
		{ type: "header", text: "Owner name" },
		{ type: "header", text: "Owner surname" },
		{ type: "header", text: "Owner occupation" },
		{ type: "header", text: "Owner residences" },
		{ type: "header", text: "Articles of list" },
		{ type: "header", text: "Kind of property" },
	],
};

const getRows = (people: RowData[]): Row[] => [
	headerRow,
	...people.map<Row>((person, idx) => ({
		rowId: idx,
		cells: [
			{ type: "text", text: person.localName },
			{ type: "text", text: person.plotNumber },
			{ type: "text", text: person.refPart },
			{ type: "text", text: person.refNumber },
			{ type: "text", text: person.ownerName },
			{ type: "text", text: person.ownerSurname },
			{ type: "text", text: person.ownerOccupation },
			{ type: "text", text: person.ownerResidences },
			{ type: "text", text: person.articlesOfList },
			{ type: "text", text: person.kindOfProperty },
		],
	})),
];

function App() {
	const viewer = useRef<Runtime | null>(null);
	const [people] = useState<RowData[]>(getRowData());

	const [topOffset, setTopOffset] = useState(440);

	const rows = useMemo(() => getRows(people), [people]);
	const columns = useMemo(() => getColumns(), []);

	const table = useMemo(
		() => (
			<ReactGrid
				stickyTopRows={1}
				// canReorderColumns
				// canReorderRows
				rows={rows}
				columns={columns}
				enableColumnResizeOnAllHeaders
				enableFillHandle
				onFocusLocationChanged={({ rowId }: any) => {
					setTopOffset((prev) => {
						const newOffset = 440 + Number(rowId) * 25;
						if (viewer.current) {
							viewer.current.world.gotoRegion({
								x: 70,
								y: newOffset,
								width: 3100,
								height: 25,
							});
						}
						return newOffset;
					});
				}}
			/>
		),
		[rows, columns],
	);

	const focalPoint = (
		<>
			{/* Table header */}
			<box
				id="focal-point"
				target={{ x: 70, y: 120, width: 3100, height: 260 }}
				style={{ outline: "2px solid red" }}
				relativeStyle
			/>

			{/* Table first row */}
			<box
				id="table-row"
				target={{ x: 70, y: topOffset, width: 3100, height: 25 }}
				style={{ outline: "1px solid blue" }}
				relativeStyle
			/>
		</>
	);

	return (
		<SimpleViewerProvider manifest="https://iiif.ghentcdh.ugent.be/iiif/manifests/test:primitief_kadaster_leggers:GENT_B_0001-0172">
			<div className="w-full p-4 h-screen flex flex-col gap-3">
				<div className="flex-1 h-1/2 rounded-xl bg-slate-100 overflow-clip">
					<CanvasPanel.Viewer
						onCreated={(preset) => {
							viewer.current = preset.runtime;
						}}
						runtimeOptions={{ visibilityRatio: 1, maxUnderZoom: 1 }}
						homeCover="start"
					>
						<CanvasPanel.RenderCanvas>{focalPoint}</CanvasPanel.RenderCanvas>
					</CanvasPanel.Viewer>
				</div>
				<div className="flex-1 h-1/2 bg-slate-100 rounded-xl p-4 overflow-auto">
					{table}
				</div>
			</div>
		</SimpleViewerProvider>
	);
}

export default App;
