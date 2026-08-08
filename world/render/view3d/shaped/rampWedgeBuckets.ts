import { pushQuad, pushTriangle, type FaceBucket, type FaceCorner } from './faceBuckets';

type Point = readonly [number, number, number];
type Normal = readonly [number, number, number];
type PlanarAxes = readonly ['x' | 'y' | 'z', 'x' | 'y' | 'z'];

const SOUTH_BOTTOM_WEST: Point = [-0.5, -0.5, 0.5];
const SOUTH_BOTTOM_EAST: Point = [0.5, -0.5, 0.5];
const NORTH_BOTTOM_EAST: Point = [0.5, -0.5, -0.5];
const NORTH_BOTTOM_WEST: Point = [-0.5, -0.5, -0.5];
const NORTH_TOP_EAST: Point = [0.5, 0.5, -0.5];
const NORTH_TOP_WEST: Point = [-0.5, 0.5, -0.5];

const EAST_FACE_INDEX = 0;
const WEST_FACE_INDEX = 1;
const SLOPE_FACE_INDEX = 2;
const BOTTOM_FACE_INDEX = 3;
const NORTH_FACE_INDEX = 5;

const SLOPE_RISE = Math.SQRT1_2;

export function addRampWedgeToFaceBuckets(buckets: FaceBucket[]): void {
  addRampBottom(buckets[BOTTOM_FACE_INDEX]!);
  addRampNorthWall(buckets[NORTH_FACE_INDEX]!);
  addRampSlope(buckets[SLOPE_FACE_INDEX]!);
  addRampEastSide(buckets[EAST_FACE_INDEX]!);
  addRampWestSide(buckets[WEST_FACE_INDEX]!);
}

function addRampBottom(bucket: FaceBucket): void {
  const facing: Normal = [0, -1, 0];
  const axes: PlanarAxes = ['x', 'z'];
  pushQuad(
    bucket,
    [SOUTH_BOTTOM_WEST, NORTH_BOTTOM_WEST, NORTH_BOTTOM_EAST, SOUTH_BOTTOM_EAST].map((point) =>
      corner(point, facing, axes),
    ),
  );
}

function addRampNorthWall(bucket: FaceBucket): void {
  const facing: Normal = [0, 0, -1];
  const axes: PlanarAxes = ['x', 'y'];
  pushQuad(
    bucket,
    [NORTH_BOTTOM_WEST, NORTH_TOP_WEST, NORTH_TOP_EAST, NORTH_BOTTOM_EAST].map((point) =>
      corner(point, facing, axes),
    ),
  );
}

function addRampSlope(bucket: FaceBucket): void {
  const facing: Normal = [0, SLOPE_RISE, SLOPE_RISE];
  const axes: PlanarAxes = ['x', 'z'];
  pushQuad(
    bucket,
    [NORTH_TOP_WEST, SOUTH_BOTTOM_WEST, SOUTH_BOTTOM_EAST, NORTH_TOP_EAST].map((point) =>
      corner(point, facing, axes),
    ),
  );
}

function addRampEastSide(bucket: FaceBucket): void {
  const facing: Normal = [1, 0, 0];
  const axes: PlanarAxes = ['z', 'y'];
  pushTriangle(
    bucket,
    [SOUTH_BOTTOM_EAST, NORTH_BOTTOM_EAST, NORTH_TOP_EAST].map((point) =>
      corner(point, facing, axes),
    ),
  );
}

function addRampWestSide(bucket: FaceBucket): void {
  const facing: Normal = [-1, 0, 0];
  const axes: PlanarAxes = ['z', 'y'];
  pushTriangle(
    bucket,
    [SOUTH_BOTTOM_WEST, NORTH_TOP_WEST, NORTH_BOTTOM_WEST].map((point) =>
      corner(point, facing, axes),
    ),
  );
}

function corner(point: Point, normal: Normal, axes: PlanarAxes): FaceCorner {
  return { position: point, normal, uv: [along(point, axes[0]), along(point, axes[1])] };
}

function along(point: Point, axis: 'x' | 'y' | 'z'): number {
  return point[axis === 'x' ? 0 : axis === 'y' ? 1 : 2] + 0.5;
}
