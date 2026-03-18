import { Stack } from "@mui/material";
import AllChannelOptions from "../../components/channels/AllChannelOptions";
import UserConnectedChannels from "../../components/channels/UserConnectedChannels";

const Channels = () => {
  return (
    <Stack spacing={4}>
      <UserConnectedChannels />
      <AllChannelOptions />
    </Stack>
  );
};

export default Channels;
