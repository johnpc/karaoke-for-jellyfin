import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  ValidationError,
  createErrorMessage,
  isString,
  isNumber,
  isPositiveNumber,
  isNonNegativeNumber,
  isValidDate,
  isValidUrl,
  isValidMediaItem,
  validateMediaItem,
  isValidQueueItem,
  validateQueueItem,
  isValidConnectedUser,
  validateConnectedUser,
  isValidLyricsLine,
  isValidLyricsFile,
  validateLyricsFile,
  isValidPlaybackCommand,
  validatePlaybackCommand,
  isValidSearchRequest,
  validateSearchRequest,
  validateSessionName,
  validateUserName,
  generateId,
  sanitizeString,
  formatDuration,
  parseDuration,
  validateQueuePosition,
  reorderQueue,
} from "@/lib/validation";

// ============================================================================
// TEST HELPERS
// ============================================================================

function makeValidMediaItem() {
  return {
    id: "media_123",
    title: "Bohemian Rhapsody",
    artist: "Queen",
    duration: 354,
    jellyfinId: "jf_abc123",
    streamUrl: "http://localhost:8096/stream/abc123",
  };
}

function makeValidQueueItem() {
  return {
    id: "queue_456",
    mediaItem: makeValidMediaItem(),
    addedBy: "user_789",
    addedAt: new Date(),
    position: 0,
    status: "pending",
  };
}

function makeValidConnectedUser() {
  return {
    id: "user_001",
    name: "Alice",
    isHost: true,
    connectedAt: new Date(),
    lastSeen: new Date(),
  };
}

function makeValidLyricsLine() {
  return {
    timestamp: 5000,
    text: "Is this the real life?",
  };
}

function makeValidLyricsFile() {
  return {
    songId: "song_123",
    lines: [makeValidLyricsLine()],
    format: "lrc",
  };
}

function makeValidPlaybackCommand() {
  return {
    action: "play",
    userId: "user_001",
    timestamp: new Date(),
  };
}

function makeValidSearchRequest() {
  return {
    query: "bohemian",
  };
}

// ============================================================================
// VALIDATION ERROR
// ============================================================================

describe("ValidationError", () => {
  it("should create error with default code", () => {
    const error = new ValidationError("Something went wrong");
    expect(error.message).toBe("Something went wrong");
    expect(error.code).toBe("INVALID_REQUEST");
    expect(error.field).toBeUndefined();
    expect(error.name).toBe("ValidationError");
    expect(error).toBeInstanceOf(Error);
  });

  it("should create error with custom code and field", () => {
    const error = new ValidationError("Not found", "SONG_NOT_FOUND", "songId");
    expect(error.message).toBe("Not found");
    expect(error.code).toBe("SONG_NOT_FOUND");
    expect(error.field).toBe("songId");
  });
});

// ============================================================================
// createErrorMessage
// ============================================================================

describe("createErrorMessage", () => {
  it("should create an error message with all fields", () => {
    const result = createErrorMessage("INVALID_REQUEST", "Bad input", {
      field: "name",
    });
    expect(result.code).toBe("INVALID_REQUEST");
    expect(result.message).toBe("Bad input");
    expect(result.details).toEqual({ field: "name" });
    expect(result.timestamp).toBeInstanceOf(Date);
  });

  it("should create an error message without details", () => {
    const result = createErrorMessage("QUEUE_FULL", "Queue is full");
    expect(result.code).toBe("QUEUE_FULL");
    expect(result.message).toBe("Queue is full");
    expect(result.details).toBeUndefined();
    expect(result.timestamp).toBeInstanceOf(Date);
  });
});

// ============================================================================
// BASIC TYPE GUARDS
// ============================================================================

describe("isString", () => {
  it("should return true for strings", () => {
    expect(isString("hello")).toBe(true);
    expect(isString("")).toBe(true);
  });

  it("should return false for non-strings", () => {
    expect(isString(123)).toBe(false);
    expect(isString(null)).toBe(false);
    expect(isString(undefined)).toBe(false);
    expect(isString({})).toBe(false);
    expect(isString([])).toBe(false);
    expect(isString(true)).toBe(false);
  });
});

describe("isNumber", () => {
  it("should return true for valid numbers", () => {
    expect(isNumber(42)).toBe(true);
    expect(isNumber(0)).toBe(true);
    expect(isNumber(-5)).toBe(true);
    expect(isNumber(3.14)).toBe(true);
  });

  it("should return false for NaN", () => {
    expect(isNumber(NaN)).toBe(false);
  });

  it("should return false for non-numbers", () => {
    expect(isNumber("42")).toBe(false);
    expect(isNumber(null)).toBe(false);
    expect(isNumber(undefined)).toBe(false);
  });
});

describe("isPositiveNumber", () => {
  it("should return true for positive numbers", () => {
    expect(isPositiveNumber(1)).toBe(true);
    expect(isPositiveNumber(0.001)).toBe(true);
    expect(isPositiveNumber(999)).toBe(true);
  });

  it("should return false for zero and negative numbers", () => {
    expect(isPositiveNumber(0)).toBe(false);
    expect(isPositiveNumber(-1)).toBe(false);
  });

  it("should return false for non-numbers", () => {
    expect(isPositiveNumber("5")).toBe(false);
    expect(isPositiveNumber(NaN)).toBe(false);
  });
});

describe("isNonNegativeNumber", () => {
  it("should return true for zero and positive numbers", () => {
    expect(isNonNegativeNumber(0)).toBe(true);
    expect(isNonNegativeNumber(1)).toBe(true);
    expect(isNonNegativeNumber(100.5)).toBe(true);
  });

  it("should return false for negative numbers", () => {
    expect(isNonNegativeNumber(-1)).toBe(false);
    expect(isNonNegativeNumber(-0.001)).toBe(false);
  });

  it("should return false for non-numbers", () => {
    expect(isNonNegativeNumber("0")).toBe(false);
    expect(isNonNegativeNumber(NaN)).toBe(false);
  });
});

describe("isValidDate", () => {
  it("should return true for valid Date objects", () => {
    expect(isValidDate(new Date())).toBe(true);
    expect(isValidDate(new Date("2024-01-01"))).toBe(true);
  });

  it("should return false for invalid Date objects", () => {
    expect(isValidDate(new Date("invalid"))).toBe(false);
  });

  it("should return false for non-Date values", () => {
    expect(isValidDate("2024-01-01")).toBe(false);
    expect(isValidDate(Date.now())).toBe(false);
    expect(isValidDate(null)).toBe(false);
  });
});

describe("isValidUrl", () => {
  it("should return true for valid URLs", () => {
    expect(isValidUrl("http://example.com")).toBe(true);
    expect(isValidUrl("https://example.com/path?q=1")).toBe(true);
    expect(isValidUrl("http://localhost:8096/stream")).toBe(true);
  });

  it("should return false for invalid URLs", () => {
    expect(isValidUrl("not a url")).toBe(false);
    expect(isValidUrl("")).toBe(false);
    expect(isValidUrl("example.com")).toBe(false);
  });

  it("should return false for non-string values", () => {
    expect(isValidUrl(123)).toBe(false);
    expect(isValidUrl(null)).toBe(false);
  });
});

// ============================================================================
// MEDIA ITEM VALIDATION
// ============================================================================

describe("isValidMediaItem", () => {
  it("should return true for a valid media item", () => {
    expect(isValidMediaItem(makeValidMediaItem())).toBe(true);
  });

  it("should return true with optional album and lyricsPath", () => {
    const item = {
      ...makeValidMediaItem(),
      album: "A Night at the Opera",
      lyricsPath: "/lyrics/bohemian.lrc",
    };
    expect(isValidMediaItem(item)).toBe(true);
  });

  it("should return false for null or non-object", () => {
    expect(isValidMediaItem(null)).toBe(false);
    expect(isValidMediaItem(undefined)).toBe(false);
    expect(isValidMediaItem("string")).toBe(false);
    expect(isValidMediaItem(42)).toBe(false);
  });

  it("should return false if id is empty", () => {
    expect(isValidMediaItem({ ...makeValidMediaItem(), id: "" })).toBe(false);
  });

  it("should return false if title is empty", () => {
    expect(isValidMediaItem({ ...makeValidMediaItem(), title: "" })).toBe(
      false
    );
  });

  it("should return false if artist is empty", () => {
    expect(isValidMediaItem({ ...makeValidMediaItem(), artist: "" })).toBe(
      false
    );
  });

  it("should return false if duration is not positive", () => {
    expect(isValidMediaItem({ ...makeValidMediaItem(), duration: 0 })).toBe(
      false
    );
    expect(isValidMediaItem({ ...makeValidMediaItem(), duration: -5 })).toBe(
      false
    );
  });

  it("should return false if jellyfinId is empty", () => {
    expect(isValidMediaItem({ ...makeValidMediaItem(), jellyfinId: "" })).toBe(
      false
    );
  });

  it("should return false if streamUrl is invalid", () => {
    expect(
      isValidMediaItem({ ...makeValidMediaItem(), streamUrl: "bad-url" })
    ).toBe(false);
  });

  it("should return false if album is non-string", () => {
    expect(isValidMediaItem({ ...makeValidMediaItem(), album: 123 })).toBe(
      false
    );
  });

  it("should return false if lyricsPath is non-string", () => {
    expect(isValidMediaItem({ ...makeValidMediaItem(), lyricsPath: 123 })).toBe(
      false
    );
  });
});

describe("validateMediaItem", () => {
  it("should return valid media item", () => {
    const item = makeValidMediaItem();
    expect(validateMediaItem(item)).toEqual(item);
  });

  it("should throw ValidationError for invalid item", () => {
    expect(() => validateMediaItem({})).toThrow(ValidationError);
    expect(() => validateMediaItem({})).toThrow("Invalid media item format");
  });
});

// ============================================================================
// QUEUE ITEM VALIDATION
// ============================================================================

describe("isValidQueueItem", () => {
  it("should return true for a valid queue item", () => {
    expect(isValidQueueItem(makeValidQueueItem())).toBe(true);
  });

  it("should return true for all valid statuses", () => {
    const statuses = ["pending", "playing", "completed", "skipped"];
    statuses.forEach(status => {
      expect(isValidQueueItem({ ...makeValidQueueItem(), status })).toBe(true);
    });
  });

  it("should return false for null or non-object", () => {
    expect(isValidQueueItem(null)).toBe(false);
    expect(isValidQueueItem(undefined)).toBe(false);
  });

  it("should return false if id is empty", () => {
    expect(isValidQueueItem({ ...makeValidQueueItem(), id: "" })).toBe(false);
  });

  it("should return false if mediaItem is invalid", () => {
    expect(isValidQueueItem({ ...makeValidQueueItem(), mediaItem: {} })).toBe(
      false
    );
  });

  it("should return false if addedBy is empty", () => {
    expect(isValidQueueItem({ ...makeValidQueueItem(), addedBy: "" })).toBe(
      false
    );
  });

  it("should return false if addedAt is not a valid date", () => {
    expect(
      isValidQueueItem({ ...makeValidQueueItem(), addedAt: "not-a-date" })
    ).toBe(false);
  });

  it("should return false if position is negative", () => {
    expect(isValidQueueItem({ ...makeValidQueueItem(), position: -1 })).toBe(
      false
    );
  });

  it("should return false if status is invalid", () => {
    expect(
      isValidQueueItem({ ...makeValidQueueItem(), status: "invalid" })
    ).toBe(false);
  });
});

describe("validateQueueItem", () => {
  it("should return valid queue item", () => {
    const item = makeValidQueueItem();
    expect(validateQueueItem(item)).toEqual(item);
  });

  it("should throw ValidationError for invalid item", () => {
    expect(() => validateQueueItem({})).toThrow(ValidationError);
    expect(() => validateQueueItem({})).toThrow("Invalid queue item format");
  });
});

// ============================================================================
// USER VALIDATION
// ============================================================================

describe("isValidConnectedUser", () => {
  it("should return true for a valid user", () => {
    expect(isValidConnectedUser(makeValidConnectedUser())).toBe(true);
  });

  it("should return true with optional socketId", () => {
    const user = { ...makeValidConnectedUser(), socketId: "sock_123" };
    expect(isValidConnectedUser(user)).toBe(true);
  });

  it("should return false for null or non-object", () => {
    expect(isValidConnectedUser(null)).toBe(false);
    expect(isValidConnectedUser(undefined)).toBe(false);
  });

  it("should return false if id is empty", () => {
    expect(isValidConnectedUser({ ...makeValidConnectedUser(), id: "" })).toBe(
      false
    );
  });

  it("should return false if name is empty", () => {
    expect(
      isValidConnectedUser({ ...makeValidConnectedUser(), name: "" })
    ).toBe(false);
  });

  it("should return false if isHost is not boolean", () => {
    expect(
      isValidConnectedUser({ ...makeValidConnectedUser(), isHost: "yes" })
    ).toBe(false);
  });

  it("should return false if connectedAt is not valid date", () => {
    expect(
      isValidConnectedUser({
        ...makeValidConnectedUser(),
        connectedAt: "invalid",
      })
    ).toBe(false);
  });

  it("should return false if lastSeen is not valid date", () => {
    expect(
      isValidConnectedUser({
        ...makeValidConnectedUser(),
        lastSeen: "invalid",
      })
    ).toBe(false);
  });

  it("should return false if socketId is non-string", () => {
    expect(
      isValidConnectedUser({ ...makeValidConnectedUser(), socketId: 123 })
    ).toBe(false);
  });
});

describe("validateConnectedUser", () => {
  it("should return valid user", () => {
    const user = makeValidConnectedUser();
    expect(validateConnectedUser(user)).toEqual(user);
  });

  it("should throw ValidationError for invalid user", () => {
    expect(() => validateConnectedUser({})).toThrow(ValidationError);
    expect(() => validateConnectedUser({})).toThrow(
      "Invalid connected user format"
    );
  });
});

// ============================================================================
// LYRICS VALIDATION
// ============================================================================

describe("isValidLyricsLine", () => {
  it("should return true for a valid lyrics line", () => {
    expect(isValidLyricsLine(makeValidLyricsLine())).toBe(true);
  });

  it("should return true with optional fields", () => {
    const line = {
      ...makeValidLyricsLine(),
      duration: 3000,
      isChorus: true,
      isVerse: false,
    };
    expect(isValidLyricsLine(line)).toBe(true);
  });

  it("should return true with timestamp of 0", () => {
    expect(isValidLyricsLine({ timestamp: 0, text: "Intro" })).toBe(true);
  });

  it("should return false for null or non-object", () => {
    expect(isValidLyricsLine(null)).toBe(false);
    expect(isValidLyricsLine(undefined)).toBe(false);
  });

  it("should return false if timestamp is negative", () => {
    expect(isValidLyricsLine({ timestamp: -1, text: "hello" })).toBe(false);
  });

  it("should return false if text is not string", () => {
    expect(isValidLyricsLine({ timestamp: 0, text: 123 })).toBe(false);
  });

  it("should return false if duration is not positive", () => {
    expect(isValidLyricsLine({ timestamp: 0, text: "hi", duration: 0 })).toBe(
      false
    );
    expect(isValidLyricsLine({ timestamp: 0, text: "hi", duration: -1 })).toBe(
      false
    );
  });

  it("should return false if isChorus is not boolean", () => {
    expect(
      isValidLyricsLine({ timestamp: 0, text: "hi", isChorus: "yes" })
    ).toBe(false);
  });

  it("should return false if isVerse is not boolean", () => {
    expect(isValidLyricsLine({ timestamp: 0, text: "hi", isVerse: 1 })).toBe(
      false
    );
  });
});

describe("isValidLyricsFile", () => {
  it("should return true for a valid lyrics file", () => {
    expect(isValidLyricsFile(makeValidLyricsFile())).toBe(true);
  });

  it("should return true for all valid formats", () => {
    const formats = ["lrc", "srt", "txt", "vtt"];
    formats.forEach(format => {
      expect(isValidLyricsFile({ ...makeValidLyricsFile(), format })).toBe(
        true
      );
    });
  });

  it("should return true for empty lines array", () => {
    expect(isValidLyricsFile({ ...makeValidLyricsFile(), lines: [] })).toBe(
      true
    );
  });

  it("should return false for null or non-object", () => {
    expect(isValidLyricsFile(null)).toBe(false);
    expect(isValidLyricsFile(undefined)).toBe(false);
  });

  it("should return false if songId is empty", () => {
    expect(isValidLyricsFile({ ...makeValidLyricsFile(), songId: "" })).toBe(
      false
    );
  });

  it("should return false if lines is not an array", () => {
    expect(
      isValidLyricsFile({ ...makeValidLyricsFile(), lines: "not array" })
    ).toBe(false);
  });

  it("should return false if any line is invalid", () => {
    expect(
      isValidLyricsFile({
        ...makeValidLyricsFile(),
        lines: [{ timestamp: -1, text: "bad" }],
      })
    ).toBe(false);
  });

  it("should return false if format is invalid", () => {
    expect(isValidLyricsFile({ ...makeValidLyricsFile(), format: "mp3" })).toBe(
      false
    );
  });
});

describe("validateLyricsFile", () => {
  it("should return valid lyrics file", () => {
    const file = makeValidLyricsFile();
    expect(validateLyricsFile(file)).toEqual(file);
  });

  it("should throw ValidationError for invalid file", () => {
    expect(() => validateLyricsFile({})).toThrow(ValidationError);
    expect(() => validateLyricsFile({})).toThrow("Invalid lyrics file format");
  });
});

// ============================================================================
// PLAYBACK VALIDATION
// ============================================================================

describe("isValidPlaybackCommand", () => {
  it("should return true for valid commands", () => {
    expect(isValidPlaybackCommand(makeValidPlaybackCommand())).toBe(true);
  });

  it("should return true for all valid actions", () => {
    const actions = [
      "play",
      "pause",
      "stop",
      "skip",
      "previous",
      "seek",
      "volume",
      "mute",
    ];
    actions.forEach(action => {
      expect(
        isValidPlaybackCommand({ ...makeValidPlaybackCommand(), action })
      ).toBe(true);
    });
  });

  it("should return true with optional value", () => {
    expect(
      isValidPlaybackCommand({
        ...makeValidPlaybackCommand(),
        action: "volume",
        value: 50,
      })
    ).toBe(true);
  });

  it("should return false for null or non-object", () => {
    expect(isValidPlaybackCommand(null)).toBe(false);
    expect(isValidPlaybackCommand(undefined)).toBe(false);
  });

  it("should return false for invalid action", () => {
    expect(
      isValidPlaybackCommand({
        ...makeValidPlaybackCommand(),
        action: "rewind",
      })
    ).toBe(false);
  });

  it("should return false if userId is empty", () => {
    expect(
      isValidPlaybackCommand({ ...makeValidPlaybackCommand(), userId: "" })
    ).toBe(false);
  });

  it("should return false if timestamp is not a valid date", () => {
    expect(
      isValidPlaybackCommand({
        ...makeValidPlaybackCommand(),
        timestamp: "bad",
      })
    ).toBe(false);
  });

  it("should return false if value is negative", () => {
    expect(
      isValidPlaybackCommand({
        ...makeValidPlaybackCommand(),
        value: -1,
      })
    ).toBe(false);
  });
});

describe("validatePlaybackCommand", () => {
  it("should return valid command", () => {
    const cmd = makeValidPlaybackCommand();
    expect(validatePlaybackCommand(cmd)).toEqual(cmd);
  });

  it("should throw ValidationError for invalid command", () => {
    expect(() => validatePlaybackCommand({})).toThrow(ValidationError);
    expect(() => validatePlaybackCommand({})).toThrow(
      "Invalid playback command format"
    );
  });

  it("should throw if volume value exceeds 100", () => {
    const cmd = {
      ...makeValidPlaybackCommand(),
      action: "volume",
      value: 101,
    };
    expect(() => validatePlaybackCommand(cmd)).toThrow(
      "Volume must be between 0 and 100"
    );
  });

  it("should throw if volume value is negative", () => {
    const cmd = {
      ...makeValidPlaybackCommand(),
      action: "volume",
      value: -1,
    };
    // This should fail at isValidPlaybackCommand since value < 0
    expect(() => validatePlaybackCommand(cmd)).toThrow(ValidationError);
  });

  it("should pass if volume value is within range", () => {
    const cmd = {
      ...makeValidPlaybackCommand(),
      action: "volume",
      value: 50,
    };
    expect(validatePlaybackCommand(cmd)).toEqual(cmd);
  });

  it("should throw if seek value is negative", () => {
    // This also fails at isValidPlaybackCommand since value must be non-negative
    const cmd = {
      ...makeValidPlaybackCommand(),
      action: "seek",
      value: -10,
    };
    expect(() => validatePlaybackCommand(cmd)).toThrow(ValidationError);
  });

  it("should pass seek command with valid position", () => {
    const cmd = {
      ...makeValidPlaybackCommand(),
      action: "seek",
      value: 120,
    };
    expect(validatePlaybackCommand(cmd)).toEqual(cmd);
  });
});

// ============================================================================
// SEARCH VALIDATION
// ============================================================================

describe("isValidSearchRequest", () => {
  it("should return true for a valid search request", () => {
    expect(isValidSearchRequest(makeValidSearchRequest())).toBe(true);
  });

  it("should return true with limit and offset", () => {
    expect(
      isValidSearchRequest({ query: "queen", limit: 10, offset: 20 })
    ).toBe(true);
  });

  it("should return false for null or non-object", () => {
    expect(isValidSearchRequest(null)).toBe(false);
    expect(isValidSearchRequest(undefined)).toBe(false);
  });

  it("should return false if query is empty or whitespace", () => {
    expect(isValidSearchRequest({ query: "" })).toBe(false);
    expect(isValidSearchRequest({ query: "   " })).toBe(false);
  });

  it("should return false if limit exceeds 1000", () => {
    expect(isValidSearchRequest({ query: "test", limit: 1001 })).toBe(false);
  });

  it("should return false if limit is 0 or negative", () => {
    expect(isValidSearchRequest({ query: "test", limit: 0 })).toBe(false);
    expect(isValidSearchRequest({ query: "test", limit: -1 })).toBe(false);
  });

  it("should return false if offset is negative", () => {
    expect(isValidSearchRequest({ query: "test", offset: -1 })).toBe(false);
  });
});

describe("validateSearchRequest", () => {
  it("should return validated request with defaults", () => {
    const result = validateSearchRequest({ query: "  queen  " });
    expect(result.query).toBe("queen");
    expect(result.limit).toBe(50);
    expect(result.offset).toBe(0);
  });

  it("should preserve provided limit and offset", () => {
    const result = validateSearchRequest({
      query: "test",
      limit: 25,
      offset: 10,
    });
    expect(result.limit).toBe(25);
    expect(result.offset).toBe(10);
  });

  it("should throw ValidationError for invalid request", () => {
    expect(() => validateSearchRequest({ query: "" })).toThrow(ValidationError);
    expect(() => validateSearchRequest({ query: "" })).toThrow(
      "Invalid search request format"
    );
  });
});

// ============================================================================
// SESSION VALIDATION
// ============================================================================

describe("validateSessionName", () => {
  it("should return trimmed name for valid input", () => {
    expect(validateSessionName("  Karaoke Night  ")).toBe("Karaoke Night");
  });

  it("should throw for empty name", () => {
    expect(() => validateSessionName("")).toThrow(ValidationError);
    expect(() => validateSessionName("")).toThrow("Session name is required");
  });

  it("should throw for whitespace-only name", () => {
    expect(() => validateSessionName("   ")).toThrow(ValidationError);
  });

  it("should throw for name exceeding 100 characters", () => {
    const longName = "a".repeat(101);
    expect(() => validateSessionName(longName)).toThrow(ValidationError);
    expect(() => validateSessionName(longName)).toThrow(
      "Session name must be 100 characters or less"
    );
  });

  it("should accept name at exactly 100 characters", () => {
    const exactName = "a".repeat(100);
    expect(validateSessionName(exactName)).toBe(exactName);
  });
});

describe("validateUserName", () => {
  it("should return sanitized name for valid input", () => {
    expect(validateUserName("  Alice  ")).toBe("Alice");
  });

  it("should throw for empty name", () => {
    expect(() => validateUserName("")).toThrow(ValidationError);
    expect(() => validateUserName("")).toThrow("User name is required");
  });

  it("should throw for whitespace-only name", () => {
    expect(() => validateUserName("   ")).toThrow(ValidationError);
  });

  it("should throw for name exceeding 50 characters", () => {
    const longName = "a".repeat(51);
    expect(() => validateUserName(longName)).toThrow(ValidationError);
    expect(() => validateUserName(longName)).toThrow(
      "User name must be 50 characters or less"
    );
  });

  it("should remove harmful characters", () => {
    expect(validateUserName("Alice<script>")).toBe("Alicescript");
    expect(validateUserName('Bob "the" builder')).toBe("Bob the builder");
    expect(validateUserName("Tom & Jerry")).toBe("Tom  Jerry");
    expect(validateUserName("O'Brien")).toBe("OBrien");
  });

  it("should throw if name is only harmful characters", () => {
    expect(() => validateUserName("<>\"'&")).toThrow(ValidationError);
    expect(() => validateUserName("<>\"'&")).toThrow(
      "User name contains only invalid characters"
    );
  });
});

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

describe("generateId", () => {
  it("should return a non-empty string", () => {
    const id = generateId();
    expect(typeof id).toBe("string");
    expect(id.length).toBeGreaterThan(0);
  });

  it("should generate unique IDs", () => {
    const ids = new Set(Array.from({ length: 100 }, () => generateId()));
    expect(ids.size).toBe(100);
  });

  it("should contain timestamp and random part", () => {
    const id = generateId();
    expect(id).toMatch(/^\d+-[a-z0-9]+$/);
  });
});

describe("sanitizeString", () => {
  it("should trim and remove harmful characters", () => {
    expect(sanitizeString("  hello<world>  ")).toBe("helloworld");
  });

  it("should truncate to maxLength", () => {
    expect(sanitizeString("abcdefgh", 5)).toBe("abcde");
  });

  it("should use default maxLength of 1000", () => {
    const longString = "a".repeat(1500);
    expect(sanitizeString(longString).length).toBe(1000);
  });

  it("should return empty string for non-string input", () => {
    expect(sanitizeString(null as unknown as string)).toBe("");
    expect(sanitizeString(123 as unknown as string)).toBe("");
  });

  it("should remove quotes and ampersands", () => {
    expect(sanitizeString('it\'s a "test" & check')).toBe("its a test  check");
  });
});

describe("formatDuration", () => {
  it("should format seconds into m:ss", () => {
    expect(formatDuration(0)).toBe("0:00");
    expect(formatDuration(59)).toBe("0:59");
    expect(formatDuration(60)).toBe("1:00");
    expect(formatDuration(125)).toBe("2:05");
    expect(formatDuration(3661)).toBe("61:01");
  });

  it("should handle fractional seconds by flooring", () => {
    expect(formatDuration(90.7)).toBe("1:30");
  });

  it("should return 0:00 for invalid input", () => {
    expect(formatDuration(-5)).toBe("0:00");
    expect(formatDuration(NaN)).toBe("0:00");
    expect(formatDuration("abc" as unknown as number)).toBe("0:00");
  });
});

describe("parseDuration", () => {
  it("should parse m:ss format", () => {
    expect(parseDuration("0:00")).toBe(0);
    expect(parseDuration("1:30")).toBe(90);
    expect(parseDuration("5:05")).toBe(305);
    expect(parseDuration("61:01")).toBe(3661);
  });

  it("should return 0 for invalid format", () => {
    expect(parseDuration("invalid")).toBe(0);
    expect(parseDuration("1:2:3")).toBe(0);
    expect(parseDuration("")).toBe(0);
  });

  it("should return 0 for non-string input", () => {
    expect(parseDuration(123 as unknown as string)).toBe(0);
    expect(parseDuration(null as unknown as string)).toBe(0);
  });
});

// ============================================================================
// QUEUE UTILITIES
// ============================================================================

describe("validateQueuePosition", () => {
  it("should return floored position when valid", () => {
    expect(validateQueuePosition(2, 5)).toBe(2);
    expect(validateQueuePosition(0, 5)).toBe(0);
  });

  it("should floor fractional positions", () => {
    expect(validateQueuePosition(2.7, 5)).toBe(2);
  });

  it("should cap position at queue length", () => {
    expect(validateQueuePosition(10, 5)).toBe(5);
    expect(validateQueuePosition(5, 5)).toBe(5);
  });

  it("should throw for negative position", () => {
    expect(() => validateQueuePosition(-1, 5)).toThrow(ValidationError);
    expect(() => validateQueuePosition(-1, 5)).toThrow(
      "Queue position must be a non-negative number"
    );
  });

  it("should throw for NaN position", () => {
    expect(() => validateQueuePosition(NaN, 5)).toThrow(ValidationError);
  });
});

describe("reorderQueue", () => {
  const makeQueue = (): any[] => [
    { id: "a", position: 0 },
    { id: "b", position: 1 },
    { id: "c", position: 2 },
  ];

  it("should move item from one position to another", () => {
    const result = reorderQueue(makeQueue(), 0, 2);
    expect(result[0].id).toBe("b");
    expect(result[1].id).toBe("c");
    expect(result[2].id).toBe("a");
  });

  it("should update positions after reorder", () => {
    const result = reorderQueue(makeQueue(), 2, 0);
    expect(result[0].position).toBe(0);
    expect(result[1].position).toBe(1);
    expect(result[2].position).toBe(2);
    expect(result[0].id).toBe("c");
  });

  it("should not mutate the original array", () => {
    const original = makeQueue();
    reorderQueue(original, 0, 2);
    expect(original[0].id).toBe("a");
  });

  it("should return empty array for non-array input", () => {
    expect(reorderQueue(null as unknown as any[], 0, 1)).toEqual([]);
    expect(reorderQueue("bad" as unknown as any[], 0, 1)).toEqual([]);
  });
});
