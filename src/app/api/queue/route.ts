// API route for queue management — thin dispatcher to handler modules
import { NextRequest, NextResponse } from "next/server";
import { handleGet, handlePost, handleDelete, handlePut } from "./handlers";

export async function GET(request: NextRequest): Promise<NextResponse> {
  return handleGet(request);
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  return handlePost(request);
}

export async function DELETE(request: NextRequest): Promise<NextResponse> {
  return handleDelete(request);
}

export async function PUT(request: NextRequest): Promise<NextResponse> {
  return handlePut(request);
}
