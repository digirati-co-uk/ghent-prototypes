import {
	type CellChange,
	type Column,
	ReactGrid,
	type Row,
	type TextCell,
} from "@silevis/reactgrid";
import { CanvasPanel, SimpleViewerProvider } from "react-iiif-vault";
import "@silevis/reactgrid/styles.css";
import type { Runtime } from "@atlas-viewer/atlas";
import { useCallback, useMemo, useRef, useState } from "react";
import { useStore } from "zustand";
import { createRowHeightStore } from "./row-height-store";

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
	Array.from({ length: 33 }, (_, i) => ({
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

const manifests = [
	{
		id: "https://iiif.ghentcdh.ugent.be/iiif/manifests/test:primitief_kadaster_leggers:GENT_B_0001-0172",
		label: "Ghent 1",
		width: 3100,
		marginTop: 420,
		defaultHeight: 50,
	},
	{
		id: "https://sandbox.zenodo.org/api/iiif/record:385592/manifest",
		label: "Botanic Garden 1",
		width: 3709,
		marginTop: 1150,
		defaultHeight: 60,
	},
	{
		id: "https://sandbox.zenodo.org/api/iiif/record:385594/manifest",
		label: "Botanic Garden 2",
		width: 3709,
		marginTop: 500,
		defaultHeight: 140,
	},
	{
		id: "https://sandbox.zenodo.org/api/iiif/record:385598/manifest",
		label: "Botanic Garden 3",
		width: 7800,
		marginTop: 520,
		defaultHeight: 120,
	},
	{
		id: "https://damsssl.llgc.org.uk/iiif/2.0/5798978/manifest.json",
		label: "NLW",
		width: 3100,
		marginTop: 300,
		defaultHeight: 50,
	},
];

const applyChangesToTable = (
	changes: CellChange<TextCell>[],
	prevPeople: RowData[],
): RowData[] => {
	changes.forEach((change) => {
		const personIndex = change.rowId as number;
		const fieldName = change.columnId as keyof RowData;
		prevPeople[personIndex][fieldName] = change.newCell.text;
	});
	return [...prevPeople];
};

function App() {
	const [manifestId, setManifestId] = useState(
		"https://iiif.ghentcdh.ugent.be/iiif/manifests/test:primitief_kadaster_leggers:GENT_B_0001-0172",
	);
	const store = useMemo(
		() =>
			createRowHeightStore({
				defaultHeight:
					manifests.find((m) => m.id === manifestId)?.defaultHeight || 50,
				marginTop: manifests.find((m) => m.id === manifestId)?.marginTop || 50,
			}),
		[manifestId],
	);
	const storeData = useStore(store);
	const height = storeData.resolveHeight();
	const [width, setWidth] = useState(3100);

	const viewer = useRef<Runtime | null>(null);
	const [rowData, setRowData] = useState<RowData[]>(getRowData());
	const handleChanges = (changes: CellChange<TextCell>[]) => {
		setRowData((prevData) => applyChangesToTable(changes, prevData));
	};

	const [topOffset, setTopOffset] = useState(440);

	const rows = useMemo(() => getRows(rowData), [rowData]);
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
				onCellsChanged={handleChanges as any}
				onFocusLocationChanged={({ rowId }: any) => {
					storeData.setIndex(Number(rowId));
					setTopOffset((prev) => {
						// const newOffset = 440 + Number(rowId) * 25;
						const newOffset = storeData.calculateOffsetHeight();
						if (viewer.current) {
							viewer.current.world.gotoRegion({
								x: 70,
								y: newOffset,
								width: width,
								height: storeData.resolveHeight(),
							});
						}
						return newOffset;
					});
				}}
			/>
		),
		[rows, columns, manifestId],
	);

	const focalPoint = (
		<>
			{/* Table header */}
			{/*<box
				id="focal-point"
				target={{ x: 70, y: 120, width: 3100, height: 260 }}
				style={{ outline: "2px solid red" }}
				relativeStyle
			/>*/}

			{/* Table first row */}
			<box
				id="table-row"
				target={{
					x: 70,
					y: storeData.calculateOffsetHeight(),
					width: width,
					height: height,
				}}
				style={{ outline: "1px solid blue" }}
				relativeStyle
			/>
		</>
	);

	return (
		<SimpleViewerProvider manifest={manifestId} key={manifestId}>
			<div className="p-4 flex flex-row gap-3">
				<div>Select manifest:</div>
				<select
					className="bg-gray-200 border border-gray-300 rounded py-1 px-3"
					value={manifestId}
					onChange={(e) => {
						setManifestId(e.target.value);
						setWidth(
							manifests.find((m) => m.id === e.target.value)?.width || 3100,
						);
					}}
				>
					{manifests.map((m) => (
						<option key={m.id} value={m.id}>
							{m.label}
						</option>
					))}
				</select>
			</div>
			<div className="w-full p-4 h-screen flex flex-col gap-3">
				<div className="flex items-center gap-4">
					Debug: h:{~~height} x:{~~storeData.calculateOffsetHeight()}
					<div className="flex items-center gap-2">
						<button
							className="bg-green-500 hover:bg-green-400 text-white py-1.5 px-3 rounded"
							onClick={() =>
								storeData.addCorrection(storeData.currentIndex, 10)
							}
						>
							Correct + 10
						</button>
						<button
							className="bg-green-500 hover:bg-green-400 text-white py-1.5 px-3 rounded"
							onClick={() =>
								storeData.addCorrection(storeData.currentIndex, -10)
							}
						>
							Correct - 10
						</button>
					</div>
				</div>
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
