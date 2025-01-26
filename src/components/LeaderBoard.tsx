import {useEffect, useRef, useState} from 'react';
import {styled} from '@mui/material/styles';
import {motion} from 'framer-motion';
import {
    Box,
    Button,
    Dialog,
    DialogActions,
    DialogContent,
    DialogTitle,
    IconButton,
    Paper,
    Stack,
    Tab,
    Tabs,
    TextField,
    Typography
} from '@mui/material';
import {ArrowUp, Medal, Target, Trash2, Trophy} from 'lucide-react';

export interface Score {
    id: number;
    name: string;
    score: number;
}

export interface TrackScores {
    track: 'easy' | 'medium' | 'hard';
    scores: Score[];
}

interface LeaderBoardProps {
    scores: TrackScores[];
    pendingScore: { score: number, track: TrackScores['track'] } | null;
    clearPendingAndAddScore: (name: string, score: number, track: TrackScores['track']) => void;
    clearLeaderBoard: () => void;
    latestScoreID: number | null;
}

const StyledPaper = styled(Paper)(({theme}) => ({
    background: 'linear-gradient(#33bbff, #08c, #004466)',
    borderRadius: theme.spacing(2),
    padding: theme.spacing(3),
    color: '#fff',
    margin: '0 auto',
    position: 'relative',
    overflow: 'hidden',
    boxShadow: '0 8px 32px rgba(0, 136, 204, 0.2)',
}));


const StyledTab = styled(Tab)(() => ({
    color: 'rgba(255, 255, 255, 0.7)',
    '&.Mui-selected': {
        color: '#fff',
    },
}));

const ScoreItem = styled('span')<{ isLatest?: boolean }>(({theme, isLatest}) => ({
    display: 'flex',
    alignItems: 'center',
    padding: theme.spacing(1.5),
    marginBottom: theme.spacing(1),
    backgroundColor: isLatest ? 'rgba(255, 255, 255, 0.4)' : 'rgba(255, 255, 255, 0.1)',
    borderRadius: theme.spacing(1),
    transition: 'transform 0.2s ease',
    '&:hover': {
        transform: 'scale(1.05)',
    },
}));

const RankIcon = styled(Box)(({theme}) => ({
    marginRight: theme.spacing(2),
    display: 'flex',
    alignItems: 'center',
}));

export default function LeaderBoard({
                                        scores,
                                        pendingScore,
                                        clearPendingAndAddScore,
                                        clearLeaderBoard,
                                        latestScoreID
                                    }: LeaderBoardProps) {
    const [selectedTrack, setSelectedTrack] = useState(0);
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [playerName, setPlayerName] = useState('');
    const [error, setError] = useState('');
    const scoresRef = useRef<HTMLDivElement>(null);
    const latestScoreRef = useRef<HTMLDivElement>(null);
    const [isScrolled, setIsScrolled] = useState(false)

    useEffect(() => {
        if (pendingScore !== null) {
            setIsDialogOpen(true);
        }
    }, [pendingScore]);

    useEffect(() => {
        if (latestScoreID && !pendingScore) {
            scrollToLatestScore();
        }
    }, [latestScoreID, pendingScore]);

    const handleSubmit = () => {
        if (!playerName.trim()) {
            setError('Please enter your name');
            return;
        }
        if (pendingScore !== null) {
            clearPendingAndAddScore(playerName.trim(), pendingScore.score, pendingScore.track);
            setPlayerName('');
            setError('');
            setIsDialogOpen(false);
        }
    };

    const scrollToTop = () => {
        scoresRef.current?.scrollTo({top: 0, behavior: 'smooth'});
    };

    const scrollToLatestScore = () => {
        const latestTrack = scores.find(track => track.scores.some(score => score.id === latestScoreID))!.track
        setSelectedTrack(scores.findIndex(track => track.track === latestTrack));
        latestScoreRef.current?.scrollIntoView({behavior: 'smooth', block: 'center'});
    };

    const getRankIcon = (index: number) => {
        if (index === 0) return <Trophy size={24} color="#FFD700"/>;
        if (index === 1) return <Medal size={24} color="#C0C0C0"/>;
        if (index === 2) return <Medal size={24} color="#CD7F32"/>;
        return <Target size={20} color="#fff"/>;
    };

    return (
        <StyledPaper elevation={8}>
            <Stack direction={'row'} align={'center'} justifyContent={'center'}>
                <Typography className="m-0 p-0" variant="h4" gutterBottom
                            sx={{textAlign: 'center', fontWeight: 'bold', marginBottom: 0}}>
                    Leaderboard
                </Typography>
                <span className={'w-4'}></span>
                <IconButton
                    disabled={!scores.some(track => track.scores.length)}
                    onClick={clearLeaderBoard}
                    sx={{
                        color: 'white',
                        '&:hover': {
                            color: 'rgba(255, 0, 0,0.8)',
                        },
                    }}
                >
                    <Trash2/>
                </IconButton>
            </Stack>
            <Tabs
                value={selectedTrack}
                onChange={(_, value) => setSelectedTrack(value)}
                centered
                sx={{mb: 3}}
                TabIndicatorProps={{
                    sx: {backgroundColor: '#fff', transitionDuration: 'all 1s, opacity 0'}
                }}
            >
                {scores.map((track) => (
                    <StyledTab key={track.track} label={track.track.toUpperCase()}/>
                ))}
            </Tabs>

            <Box
                ref={scoresRef}
                onScroll={() => setIsScrolled((scoresRef.current?.scrollTop || 0) > 20)}
                className={'min-w-100'}
                sx={{
                    maxHeight: 400,
                    overflowY: 'auto',
                    pr: 1,
                    '&::-webkit-scrollbar': {
                        width: '8px',
                    },
                    '&::-webkit-scrollbar-track': {
                        background: 'rgba(255, 255, 255, 0.1)',
                        borderRadius: '4px',
                    },
                    '&::-webkit-scrollbar-thumb': {
                        background: 'rgba(255, 255, 255, 0.2)',
                        borderRadius: '4px',
                        '&:hover': {
                            background: 'rgba(255, 255, 255, 0.3)',
                        },
                    },
                }}
            >
                <motion.div initial={{height: 0}} animate={{height: 'auto'}}>
                    {scores[selectedTrack].scores.map((score, index) => (
                        <ScoreItem
                            // initial={{height: 0}}
                            className={"mx-3"}
                            key={score.id}
                            isLatest={score.id === latestScoreID}
                            ref={score.id === latestScoreID ? latestScoreRef : null}
                        >
                            <RankIcon>
                                {index < 3 ? getRankIcon(index) : <span className='font-bold text-xl'>{index + 1}</span>}
                            </RankIcon>
                            <Box sx={{flexGrow: 1}}>
                                <Typography variant="subtitle1">{score.name}</Typography>
                                <Typography variant="body2" sx={{opacity: 0.7}}>
                                    Score: {score.score}
                                </Typography>
                            </Box>
                        </ScoreItem>
                    ))}
                </motion.div>
            </Box>

            <Stack direction={'row'} justifyContent={'end'} alignItems={'center'} marginTop={4} sx={{color: 'white'}}>
                {isScrolled &&
                  <IconButton sx={{color: 'white', background: "#ffffff33", marginLeft: 2}}
                              onClick={scrollToTop}
                  >
                    <ArrowUp size={20}/>
                  </IconButton>}

                {latestScoreID !== null && (
                    <IconButton sx={{color: 'white', background: "#ffffff33", marginLeft: 2}}
                                onClick={scrollToLatestScore}
                    >
                        <Target size={20}/>
                    </IconButton>
                )}
            </Stack>
            <Dialog
                open={isDialogOpen}
                onClose={() => {
                    if (pendingScore === null) {
                        setIsDialogOpen(false);
                    }
                }}
                PaperProps={{
                    sx: {
                        background: 'linear-gradient(#33bbff, #08c)',
                        color: '#fff',
                    },
                }}
            >
                <DialogTitle>Enter Your Name</DialogTitle>
                <DialogContent>
                    <TextField
                        color={'white'}
                        autoFocus
                        margin="dense"
                        label="Your Name"
                        value={playerName}
                        onChange={(e) => {
                            setPlayerName(e.target.value);
                            setError('');
                        }}
                        error={!!error}
                        helperText={error}
                        sx={{
                            '& .MuiInputLabel-root': {color: 'rgba(255, 255, 255, 0.7)'},
                            '& .MuiInput-root': {color: '#fff'},
                            '& .MuiInput-underline:before': {borderBottomColor: 'rgba(255, 255, 255, 0.7)'},
                            '& .MuiInput-underline:hover:not(.Mui-disabled):before': {borderBottomColor: '#fff'},
                        }}
                    />
                </DialogContent>
                <DialogActions>
                    <Button
                        onClick={handleSubmit}
                        sx={{
                            color: '#fff',
                            '&:hover': {backgroundColor: 'rgba(255, 255, 255, 0.1)'},
                        }}
                    >
                        Submit
                    </Button>
                </DialogActions>
            </Dialog>
        </StyledPaper>
    );
}