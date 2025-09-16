import { createAsyncThunk, createSlice, PayloadAction } from "@reduxjs/toolkit";
import { Mestri } from "../../src/types/firestore";
import { getMestris, addMestri, updateMestri } from "../../services/firebase";

interface MestriState {
  list: Mestri[];
  loading: boolean;
  error: string | null;
}

const initialState: MestriState = {
  list: [],
  loading: false,
  error: null,
};

// Async thunks
export const fetchMestris = createAsyncThunk<Mestri[]>(
  "mestri/fetchMestris",
  async () => {
    return await getMestris();
  }
);

export const createMestri = createAsyncThunk<Mestri, Partial<Mestri>>(
  "mestri/createMestri",
  async (mestriData) => {
    return await addMestri(mestriData);
  }
);

export const editMestri = createAsyncThunk<Mestri, Mestri>(
  "mestri/editMestri",
  async (mestriData) => {
    return await updateMestri(mestriData);
  }
);

const mestriSlice = createSlice({
  name: "mestri",
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchMestris.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchMestris.fulfilled, (state, action: PayloadAction<Mestri[]>) => {
        state.loading = false;
        state.list = action.payload;
      })
      .addCase(fetchMestris.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || "Failed to fetch mestris";
      })
      .addCase(createMestri.fulfilled, (state, action: PayloadAction<Mestri>) => {
        state.list.push(action.payload);
      })
      .addCase(editMestri.fulfilled, (state, action: PayloadAction<Mestri>) => {
        const index = state.list.findIndex((m) => m.id === action.payload.id);
        if (index !== -1) state.list[index] = action.payload;
      });
  },
});

export default mestriSlice.reducer;