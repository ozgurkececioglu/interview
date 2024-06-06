import {
  CircularProgress,
  Divider,
  Drawer,
  IconButton,
  TextField,
  Typography,
} from "@mui/material";
import { Suspense } from "react";
import { SkeletonList } from "../skeleton-list/SkeletonList";
import { CommentsList } from "../comments-list/CommentsList";
import { Post } from "../../types/Post";
import { makeStyles } from "tss-react/mui";
import { useCommentInputState } from "./hooks/useCommentInputState";
import { Send, Visibility } from "@mui/icons-material";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { postComment } from "../../api/postComment";
import { Comment } from "../../types/Comment";
import { useAuthenticationContext } from "../../hooks/useAuthenticationContext";
import invariant from "invariant";

const useStyles = makeStyles()((theme) => ({
  root: {
    width: 400,
    padding: theme.spacing(2),
    display: "flex",
    flexDirection: "column",
    justifyContent: "space-between",
    height: "100%",
  },
  views: {
    display: "flex",
    alignItems: "center",
    gap: theme.spacing(1),
    justifyContent: "flex-end",
  },
  list: {
    display: "flex",
    flexDirection: "column",
    flexGrow: 1,
  },
  footer: {
    display: "flex",
    alignItems: "center",
    gap: theme.spacing(1),
    flexWrap: "nowrap",
  },
}));

interface Props {
  open: boolean;
  selectedPost: Post | null;
  onClose: () => void;
}

export const PostDetailDrawer = ({ open, onClose, selectedPost }: Props) => {
  const { classes } = useStyles();
  const queryClient = useQueryClient();
  const { user: currentUser } = useAuthenticationContext();

  const { mutateAsync, isPending } = useMutation({
    mutationFn: postComment,
    onSuccess: async () => {
      return await queryClient.invalidateQueries({ queryKey: ["comments"] });
    },
  });

  const { handleChange, value, reset: resetInput } = useCommentInputState();

  const handleSubmit = async () => {
    invariant(
      currentUser !== null,
      "User must be authenticated to post a comment"
    );
    invariant(selectedPost !== null, "Post must be selected to post a comment");

    // id will be generated by the server
    const newComment: Omit<Comment, "id"> = {
      postId: selectedPost.id,
      text: value,
      authorId: currentUser?.id,
    };

    try {
      await mutateAsync(newComment);

      resetInput();
    } catch (error) {
      console.error(error);
    }
  };

  return (
    <Drawer anchor="right" open={open} onClose={onClose}>
      <div className={classes.root}>
        <Typography variant="h5">{selectedPost?.title}</Typography>
        <Typography my={3}>{selectedPost?.content}</Typography>

        <div className={classes.views}>
          <Visibility color="disabled" />
          <Typography color="GrayText" variant="body2">
            {selectedPost?.views}
          </Typography>
        </div>

        <Divider />

        <Typography variant="h5" mt={3}>
          Comments
        </Typography>
        <div className={classes.list}>
          <Suspense fallback={<SkeletonList />}>
            {selectedPost && <CommentsList postId={selectedPost.id} />}
          </Suspense>
        </div>

        <div className={classes.footer}>
          <TextField
            label="Comment"
            variant="outlined"
            value={value}
            onChange={handleChange}
            fullWidth
            disabled={isPending}
            InputProps={{
              endAdornment: isPending && <CircularProgress size={20} />,
            }}
          />
          <IconButton onClick={handleSubmit} disabled={isPending}>
            <Send color="primary" />
          </IconButton>
        </div>
      </div>
    </Drawer>
  );
};