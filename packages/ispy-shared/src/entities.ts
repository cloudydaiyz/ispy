/** User with credentials to access the game. Users are temporary; they are deleted whenever the game ends. */
interface User {

    /** Assigned on user creation */
	userId: string;

    /** Must be unique and between 8 and 15 ASCII characters */
	username: string;

    /** Hashed password. Must be between 8 and 100 ASCII characters */
	password: string;

    /** The user's role for the current game. */
	role: "player" | "host" | "admin";
}

interface GameConfiguration {

	// max 50 ASCII characters
	title: string;

	// between 1 and 20 tasks must be defined
	// at least 1 required task must be defined
	tasks: Task[];

	// criteria for the game to end aside from the time limit
	// player completion = all REQUIRED tasks are complete
	// the `<N>` must be an actual number between 
	completionCriteria: "only time limit" | "all users complete" | "first user to complete" | "first <N> users to complete";

	// true if the game should continue even if it's completed
	continueOnCompletion: boolean;

	// integer, [0, 100]
	minPlayers: number;

	// integer, [minPlayers, 100]
	maxPlayers: number;

	// date, [60 + current time, 86400 + current time]
	startDate: Date;

    // date, [60 + startDate, 86400 + startDate]
	// cannot be defined if time limit is defined
	// host can always manually end the game even if the time limit isn't reached
	endDate: Date;

	// default: yes
	playersCanViewPreviousTasks: boolean;

	// default: false
	lockedOnCreate: boolean;

	// default: false
	// can be reconfigured during the game
	lockedWhileRunning: boolean;
}

interface Task {

	// automatically assigned on game creation
	id?: string;
    
	// max 50 ASCII characters
	title: string;

	// max 500 ASCII characters
	prompt: string;

	responses: {

		// automatically assigned on game creation
		id?: string;

		// max 150 ASCII characters
		content: string;

        correct: boolean;

	}[];

	responseType: "no response" | "single select" | "multi select" | "multiple choice";

	// integer
	// 0 for indefinite
	// 1 to (max # of responses - 1)
	maxAttempts: number;

	required: boolean;

	successCriteria: "visiting" | "correct response";

	// integer, [0, 100]
	successValue: number;

	// if true, the success value of this task will be hidden from the player, and hides whether it's scaled over time (both shown by default)
	// false by default
	hideSuccessValue: boolean;

	// integer, [-1, 0, 1]
	// if true, the value for completing this task successfully will be scaled down linearly as time progresses
	// -1 for scaled down, 0 for no scaling, 1 for scaled up
	scaleSuccessValueOverTime: number;

	// integer, [0, 100]
	failValue: number;

	// if true, the fail value of this task will be hidden from the player, and hides whether it's scaled over time (both shown by default)
	// false by default
	hideFailValue: boolean;

	// integer, [-1, 0, 1]
	// if true, the value for failing this task will be scaled down linearly as time progresses
	// -1 for scaled down, 0 for no scaling, 1 for scaled up
	scaleFailValueOverTime: number;

	// max 500 ASCII characters
	successMessage?: string;

	// max 500 ASCII characters
	// shows when you have used ALL attempts
	// undefined by default for 0 max attempts
	failMessage?: string;

}

// hash
// populated when the game is created
interface GameStats { 

	id: string;
	
	hostUserId: string;
	
	hostUsername: string;
	
	configuration: GameConfiguration;
	
	state: "not ready" | "ready" | "running" | "ended";
	
	locked: boolean;

	// list of usernames
	players: string[];
	
	// list of usernames
	admins: string[];
	
	// null if the game hasn't started yet and has no predefined start time
	// Date if the game has a predefined start time or the time that the host manually started the game
	startTime: Date | null;
	
	// null if the game hasn't ended yet and has no predefined end time
	// Date if the game has a predefined end time or the time that the host manually ended the game
	endTime: Date | null;
	
	// true if a game is completed
	// a game can end before it's considered completed if the time limit runs out or the host manually ends the game
	completed: boolean;

}

// in redis, will be a sorted set
interface LeaderboardEntry {
	username: string; // key
	score: number; // score = points
}

// credentials for potential admins
// once a credential is taken, it cannot be reused
// when an admin is kicked, their associated credentials are removed as well
// game can have [0, 3] admins
interface Admin {

	// between 8 and 15 ASCII characters
	// must be unique
	username: string;

	// between 8 and 100 ASCII characters

	password: string;
	// if this credential is being used, the user id associated with it
	userId?: string;

}

// populated when the game is started
interface PlayerInfo { // hash

	username: string; // key

	points: number;

	numTasksSubmitted: number;

	numTasksCorrect: number;

	numTasksIncorrect: number;
	
	// nth place
	ranking: number;
	
	// difference between this player and the next player
	pointsForNextRank: number;

}

// in redis, there will be a redis stream for each player
// sorted based on submitTime
// not visible to the player if `playersCanViewPreviousTasks` is false for game configuration
interface TaskSubmission {
	taskId: string;
	submitTime: Date;
	responseId: string;
	responseContent: string;
	correct: boolean;
	pointsDelta: number;
}

type EnhancedPlayerInfo = PlayerInfo & { tasksSubmitted: TaskSubmission[] };

// will be redis JSON datatype
interface GameHistory {

	// 0 to 5 games
	results: {
		hostUsername: string;
		gameStats: GameStats;
		leaderboard: LeaderboardEntry[];
		players: EnhancedPlayerInfo[];
	}[];

}