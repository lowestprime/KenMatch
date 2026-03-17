export interface ActionState {
  status: "idle" | "error" | "success";
  message: string;
  fieldErrors?: Record<string, string>;
}

export const initialActionState: ActionState = {
  status: "idle",
  message: "",
};
