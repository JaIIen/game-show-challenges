import { useState, useEffect, useCallback } from 'react'
import { supabase } from './supabase'
import './App.css'

const initialChallenges = [
  { id: 1, title: 'Score a goal against Jal in FIFA', description: '', completed_by: [] },
  { id: 2, title: 'Hold a phone conversation with someone another team chooses for at least 3 minutes', description: '', completed_by: [] },
  { id: 3, title: 'Blindfolded pool', description: '', completed_by: [] },
  { id: 4, title: 'Biscuit from forehead to mouth', description: '', completed_by: [] },
  { id: 5, title: 'Hit 4 shots in a row in beer pong', description: '', completed_by: [] },
  { id: 6, title: 'Mr and Mrs', description: '', completed_by: [] },
  { id: 7, title: 'Bring Jal a flower', description: '', completed_by: [] },
  { id: 8, title: 'Wheelbarrow', description: '', completed_by: [] },
  { id: 9, title: '12 headers to each other', description: '', completed_by: [] },
  { id: 10, title: 'Build a whole jenga tower only using your mouths', description: '', completed_by: [] },
  { id: 11, title: 'Bounce a ping pong ball off a wall into a mug', description: 'The mug has to be at least 0.5m from the wall', completed_by: [] },
  { id: 12, title: 'Weak hand only catch, 10 in a row, 3m apart', description: '', completed_by: [] },
  { id: 13, title: 'Memory test', description: '', completed_by: [] },
  { id: 14, title: 'Stop a stopwatch exactly on 10 seconds', description: '', completed_by: [] },
  { id: 15, title: 'Bottle flip 5x in a row', description: '', completed_by: [] },
  { id: 16, title: 'Find Rev', description: '', completed_by: [] },
  { id: 17, title: 'Ruler drop', description: 'Hold against wall, let go, spin and pin it against wall', completed_by: [] },
  { id: 18, title: 'Trivia Round', description: '', completed_by: [] },
  { id: 19, title: 'Squat your teammate 20 times', description: '', completed_by: [] },
  { id: 20, title: 'Standing 2 metres apart, both throw a ping pong ball that meets in the middle, twice in a row', description: '', completed_by: [] },
  { id: 21, title: 'Hold 2 ice cubes until they melt', description: 'You can swap between each other', completed_by: [] },
  { id: 22, title: 'Name Game', description: '25 secs to name 15 of X category', completed_by: [] }
]

const TEAM_COLORS = ['#FFD700', '#FF4757', '#3B82F6', '#10B981'] // Yellow, Red, Blue, Green
const ADMIN_PASSWORD = '1456'

function App() {
  const [challenges, setChallenges] = useState([])
  const [newChallenge, setNewChallenge] = useState({ title: '', description: '' })
  const [teams, setTeams] = useState([])
  const [newTeam, setNewTeam] = useState({ members: '', color: TEAM_COLORS[0] })
  const [showChallengeForm, setShowChallengeForm] = useState(false)
  const [showTeamForm, setShowTeamForm] = useState(false)
  const [selectedChallenge, setSelectedChallenge] = useState(null)
  const [selectedTeamForPoints, setSelectedTeamForPoints] = useState(null)
  const [pointsToAward, setPointsToAward] = useState('')
  const [expandedTeamId, setExpandedTeamId] = useState(null)
  const [editingTeamId, setEditingTeamId] = useState(null)
  const [manualPoints, setManualPoints] = useState('')
  const [isAdmin, setIsAdmin] = useState(() => {
    return localStorage.getItem('gameShowAdmin') === 'true'
  })
  const [showPasswordModal, setShowPasswordModal] = useState(false)
  const [passwordInput, setPasswordInput] = useState('')
  const [loading, setLoading] = useState(true)

  // Fetch data from Supabase
  const fetchData = useCallback(async () => {
    setLoading(true)

    // Fetch teams
    const { data: teamsData, error: teamsError } = await supabase
      .from('teams')
      .select('*')
      .order('created_at', { ascending: true })

    if (teamsError) {
      console.error('Error fetching teams:', teamsError)
    } else {
      setTeams(teamsData || [])
    }

    // Fetch challenges
    const { data: challengesData, error: challengesError } = await supabase
      .from('challenges')
      .select('*')
      .order('id', { ascending: true })

    if (challengesError) {
      console.error('Error fetching challenges:', challengesError)
    } else if (challengesData && challengesData.length > 0) {
      setChallenges(challengesData)
    } else {
      // Seed initial challenges if none exist
      await seedInitialChallenges()
    }

    setLoading(false)
  }, [])

  // Seed initial challenges
  const seedInitialChallenges = async () => {
    const { error } = await supabase
      .from('challenges')
      .insert(initialChallenges)

    if (error) {
      console.error('Error seeding challenges:', error)
    } else {
      setChallenges(initialChallenges)
    }
  }

  useEffect(() => {
    fetchData()
  }, [fetchData])

  // Keyboard shortcut to reset (Cmd+Shift+J on Mac, Ctrl+Shift+J on Windows)
  useEffect(() => {
    const handleKeyDown = async (e) => {
      if ((e.metaKey || e.ctrlKey) && e.shiftKey && e.key === 'J') {
        e.preventDefault()
        if (!isAdmin) {
          alert('You must be an admin to reset data')
          return
        }
        if (window.confirm('Reset all data? This will clear all teams and reset all challenges.')) {
          // Delete all teams and challenges from Supabase
          await supabase.from('teams').delete().neq('id', 0)
          await supabase.from('challenges').delete().neq('id', 0)

          // Re-seed challenges
          await seedInitialChallenges()
          setTeams([])
        }
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isAdmin])

  const handleAdminLogin = () => {
    if (passwordInput === ADMIN_PASSWORD) {
      setIsAdmin(true)
      localStorage.setItem('gameShowAdmin', 'true')
      setShowPasswordModal(false)
      setPasswordInput('')
    } else {
      alert('Incorrect password')
    }
  }

  const handleAdminLogout = () => {
    setIsAdmin(false)
    localStorage.removeItem('gameShowAdmin')
  }

  const addChallenge = async (e) => {
    e.preventDefault()
    if (!isAdmin) return
    if (newChallenge.title.trim()) {
      const newChallengeData = {
        id: Date.now(),
        title: newChallenge.title,
        description: newChallenge.description,
        completed_by: []
      }

      const { error } = await supabase
        .from('challenges')
        .insert([newChallengeData])

      if (error) {
        console.error('Error adding challenge:', error)
      } else {
        setChallenges([...challenges, newChallengeData])
        setNewChallenge({ title: '', description: '' })
      }
    }
  }

  const deleteChallenge = async (id) => {
    if (!isAdmin) return
    const challenge = challenges.find(c => c.id === id)
    if (window.confirm(`Are you sure you want to delete "${challenge.title}"?`)) {
      const { error } = await supabase
        .from('challenges')
        .delete()
        .eq('id', id)

      if (error) {
        console.error('Error deleting challenge:', error)
      } else {
        setChallenges(challenges.filter(c => c.id !== id))
      }
    }
  }

  const addTeam = async (e) => {
    e.preventDefault()
    if (!isAdmin) return
    if (newTeam.members.trim()) {
      const usedColors = teams.map(t => t.color)
      const availableColor = TEAM_COLORS.find(c => !usedColors.includes(c)) || newTeam.color

      const newTeamData = {
        id: Date.now(),
        members: newTeam.members,
        color: availableColor,
        score: 0,
        history: []
      }

      const { error } = await supabase
        .from('teams')
        .insert([newTeamData])

      if (error) {
        console.error('Error adding team:', error)
      } else {
        setTeams([...teams, newTeamData])
        setNewTeam({ members: '', color: TEAM_COLORS[0] })
      }
    }
  }

  const deleteTeam = async (id) => {
    if (!isAdmin) return
    const team = teams.find(t => t.id === id)
    if (window.confirm(`Are you sure you want to delete team "${team.members}"?`)) {
      const { error } = await supabase
        .from('teams')
        .delete()
        .eq('id', id)

      if (error) {
        console.error('Error deleting team:', error)
      } else {
        setTeams(teams.filter(t => t.id !== id))

        // Update challenges to remove this team from completed_by
        const updatedChallenges = challenges.map(c => ({
          ...c,
          completed_by: c.completed_by.filter(t => t.id !== id)
        }))

        // Update each challenge in Supabase
        for (const challenge of updatedChallenges) {
          await supabase
            .from('challenges')
            .update({ completed_by: challenge.completed_by })
            .eq('id', challenge.id)
        }

        setChallenges(updatedChallenges)
      }
    }
  }

  const handleChallengeClick = (challenge) => {
    if (!isAdmin) return
    if (teams.length === 0) {
      alert('Please add teams first!')
      return
    }
    setSelectedChallenge(challenge)
  }

  const handleTeamSelection = (team) => {
    setSelectedTeamForPoints(team)
  }

  const awardPoints = async () => {
    if (!isAdmin) return
    const points = parseInt(pointsToAward)
    if (isNaN(points) || points <= 0) {
      alert('Please enter a valid number of points')
      return
    }

    // Update team
    const updatedTeam = teams.find(t => t.id === selectedTeamForPoints.id)
    const newHistory = [...updatedTeam.history, {
      id: Date.now(),
      points: points,
      challenge: selectedChallenge.title,
      timestamp: new Date().toLocaleTimeString()
    }]

    const { error: teamError } = await supabase
      .from('teams')
      .update({
        score: updatedTeam.score + points,
        history: newHistory
      })
      .eq('id', selectedTeamForPoints.id)

    if (teamError) {
      console.error('Error updating team:', teamError)
      return
    }

    // Update challenge
    const updatedChallenge = challenges.find(c => c.id === selectedChallenge.id)
    const alreadyCompleted = updatedChallenge.completed_by.some(t => t.id === selectedTeamForPoints.id)

    if (!alreadyCompleted) {
      const newCompletedBy = [...updatedChallenge.completed_by, selectedTeamForPoints]

      const { error: challengeError } = await supabase
        .from('challenges')
        .update({ completed_by: newCompletedBy })
        .eq('id', selectedChallenge.id)

      if (challengeError) {
        console.error('Error updating challenge:', challengeError)
        return
      }

      setChallenges(challenges.map(c =>
        c.id === selectedChallenge.id
          ? { ...c, completed_by: newCompletedBy }
          : c
      ))
    }

    setTeams(teams.map(t =>
      t.id === selectedTeamForPoints.id
        ? { ...t, score: t.score + points, history: newHistory }
        : t
    ))

    setSelectedChallenge(null)
    setSelectedTeamForPoints(null)
    setPointsToAward('')
  }

  const handleManualPointChange = async (teamId, isAdding) => {
    if (!isAdmin) return
    const points = parseInt(manualPoints)
    if (isNaN(points) || points <= 0) {
      alert('Please enter a valid number of points')
      return
    }

    const finalPoints = isAdding ? points : -points
    const team = teams.find(t => t.id === teamId)

    const newHistory = [...team.history, {
      id: Date.now(),
      points: finalPoints,
      challenge: 'Manual adjustment',
      timestamp: new Date().toLocaleTimeString()
    }]

    const { error } = await supabase
      .from('teams')
      .update({
        score: team.score + finalPoints,
        history: newHistory
      })
      .eq('id', teamId)

    if (error) {
      console.error('Error updating team:', error)
      return
    }

    setTeams(teams.map(t =>
      t.id === teamId
        ? { ...t, score: t.score + finalPoints, history: newHistory }
        : t
    ))

    setManualPoints('')
    setEditingTeamId(null)
  }

  const toggleTeamExpansion = (teamId) => {
    if (!isAdmin) return
    setExpandedTeamId(expandedTeamId === teamId ? null : teamId)
    setEditingTeamId(null)
    setManualPoints('')
  }

  const getTeamInitials = (members) => {
    return members.split(',').map(m => m.trim()[0]).join(', ').toUpperCase()
  }

  const getBorderGradient = (completedByTeams) => {
    if (completedByTeams.length === 0) return 'transparent'
    if (completedByTeams.length === 1) return completedByTeams[0].color

    const percentage = 100 / completedByTeams.length
    const gradientStops = completedByTeams.map((team, index) => {
      const start = index * percentage
      const end = (index + 1) * percentage
      return `${team.color} ${start}%, ${team.color} ${end}%`
    }).join(', ')

    return `linear-gradient(90deg, ${gradientStops})`
  }

  if (loading) {
    return (
      <div className="app">
        <div className="loading">
          <div className="loading-spinner"></div>
          <p>Loading...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="app">
      <header className="header">
        <h1 className="title">Roachman's 2025</h1>
        <div className="admin-controls">
          {isAdmin ? (
            <button onClick={handleAdminLogout} className="btn-admin btn-admin-logout">
              Lock Admin
            </button>
          ) : (
            <button onClick={() => setShowPasswordModal(true)} className="btn-admin">
              Unlock Admin
            </button>
          )}
        </div>
        {isAdmin && <p className="reset-hint">Press Cmd+Shift+J to reset</p>}
      </header>

      <div className="container">
        {/* Scoreboard */}
        {teams.length > 0 && (
          <div className="scoreboard">
            {teams.map(team => (
              <div key={team.id} className="team-score-wrapper">
                <div
                  className={`team-score ${expandedTeamId === team.id ? 'expanded' : ''}`}
                  style={{ borderColor: team.color }}
                  onClick={() => toggleTeamExpansion(team.id)}
                >
                  <div className="team-badge" style={{ backgroundColor: team.color }}>
                    {getTeamInitials(team.members)}
                  </div>
                  <div className="team-info">
                    <div className="team-members">{team.members}</div>
                    <div className="team-points">{team.score} pts</div>
                  </div>
                  {isAdmin && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        deleteTeam(team.id)
                      }}
                      className="btn-delete-team"
                      aria-label="Delete team"
                    >
                      ×
                    </button>
                  )}
                </div>

                {expandedTeamId === team.id && isAdmin && (
                  <div className="team-details">
                    <div className="team-actions">
                      {editingTeamId === team.id ? (
                        <div className="manual-points-input">
                          <input
                            type="number"
                            min="1"
                            placeholder="Points"
                            value={manualPoints}
                            onChange={(e) => setManualPoints(e.target.value)}
                            className="points-quick-input"
                            autoFocus
                          />
                          <button
                            onClick={() => handleManualPointChange(team.id, true)}
                            className="btn-add-points"
                          >
                            + Add
                          </button>
                          <button
                            onClick={() => handleManualPointChange(team.id, false)}
                            className="btn-subtract-points"
                          >
                            - Subtract
                          </button>
                          <button
                            onClick={() => {
                              setEditingTeamId(null)
                              setManualPoints('')
                            }}
                            className="btn-cancel-points"
                          >
                            Cancel
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => setEditingTeamId(team.id)}
                          className="btn-edit-points"
                        >
                          Add/Subtract Points
                        </button>
                      )}
                    </div>

                    <div className="team-history">
                      <h4>Points History</h4>
                      {team.history.length === 0 ? (
                        <p className="no-history">No points awarded yet</p>
                      ) : (
                        <ul>
                          {team.history.slice().reverse().map(entry => (
                            <li key={entry.id} className={entry.points > 0 ? 'positive' : 'negative'}>
                              <span className="points-change">
                                {entry.points > 0 ? '+' : ''}{entry.points} pts
                              </span>
                              <span className="challenge-name">{entry.challenge}</span>
                              <span className="timestamp">{entry.timestamp}</span>
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Add Team Section - Admin Only */}
        {isAdmin && (
          <div className="collapsible-section">
            <button
              onClick={() => setShowTeamForm(!showTeamForm)}
              className="collapse-btn"
            >
              {showTeamForm ? '▼' : '▶'} Add Team
            </button>
            {showTeamForm && (
              <form onSubmit={addTeam} className="team-form">
                <div className="form-group">
                  <input
                    type="text"
                    placeholder="Team members (comma separated)"
                    value={newTeam.members}
                    onChange={(e) => setNewTeam({ ...newTeam, members: e.target.value })}
                    className="input-title"
                  />
                </div>
                <div className="color-selector">
                  {TEAM_COLORS.map(color => (
                    <button
                      key={color}
                      type="button"
                      className={`color-option ${newTeam.color === color ? 'selected' : ''}`}
                      style={{ backgroundColor: color }}
                      onClick={() => setNewTeam({ ...newTeam, color })}
                      disabled={teams.some(t => t.color === color)}
                    >
                      {teams.some(t => t.color === color) && '✓'}
                    </button>
                  ))}
                </div>
                <button type="submit" className="btn-add">Add Team</button>
              </form>
            )}
          </div>
        )}

        {/* Add Challenge Section - Admin Only */}
        {isAdmin && (
          <div className="collapsible-section">
            <button
              onClick={() => setShowChallengeForm(!showChallengeForm)}
              className="collapse-btn"
            >
              {showChallengeForm ? '▼' : '▶'} Add Challenge
            </button>
            {showChallengeForm && (
              <form onSubmit={addChallenge} className="challenge-form">
                <div className="form-group">
                  <input
                    type="text"
                    placeholder="Challenge Title"
                    value={newChallenge.title}
                    onChange={(e) => setNewChallenge({ ...newChallenge, title: e.target.value })}
                    className="input-title"
                  />
                </div>
                <div className="form-group">
                  <textarea
                    placeholder="Challenge Description (optional)"
                    value={newChallenge.description}
                    onChange={(e) => setNewChallenge({ ...newChallenge, description: e.target.value })}
                    className="input-description"
                    rows="3"
                  />
                </div>
                <button type="submit" className="btn-add">Add Challenge</button>
              </form>
            )}
          </div>
        )}

        {/* Challenges Grid */}
        <div className="challenges-grid">
          {challenges.map((challenge) => (
            <div
              key={challenge.id}
              className={`challenge-card ${challenge.completed_by.length > 0 ? 'completed' : ''} ${!isAdmin ? 'locked' : ''}`}
              onClick={() => handleChallengeClick(challenge)}
              style={{
                backgroundColor: challenge.completed_by.length >= 1 ? '#d1fae5' : 'white'
              }}
            >
              {isAdmin && (
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    deleteChallenge(challenge.id)
                  }}
                  className="btn-delete"
                  aria-label="Delete challenge"
                >
                  ×
                </button>
              )}
              <h3 className="challenge-title">{challenge.title}</h3>
              {challenge.description && (
                <p className="challenge-description">{challenge.description}</p>
              )}
              {challenge.completed_by.length > 0 && (
                <>
                  <div className="completed-badges">
                    {challenge.completed_by.map(team => (
                      <div
                        key={team.id}
                        className="completed-badge"
                        style={{ backgroundColor: team.color }}
                      >
                        {getTeamInitials(team.members)}
                      </div>
                    ))}
                  </div>
                  <div
                    className="challenge-border-gradient"
                    style={{
                      background: challenge.completed_by.length === 1
                        ? challenge.completed_by[0].color
                        : getBorderGradient(challenge.completed_by)
                    }}
                  />
                </>
              )}
            </div>
          ))}
        </div>

        {challenges.length === 0 && (
          <div className="empty-state">
            <p>No challenges yet! Add your first challenge above.</p>
          </div>
        )}
      </div>

      {/* Modal for awarding points */}
      {selectedChallenge && isAdmin && (
        <div className="modal-overlay" onClick={() => setSelectedChallenge(null)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h2>Award Points</h2>
            <p className="modal-challenge-title">{selectedChallenge.title}</p>

            {!selectedTeamForPoints ? (
              <div className="team-selection">
                <p>Select the winning team:</p>
                {teams.map(team => (
                  <button
                    key={team.id}
                    className="team-option"
                    style={{ borderColor: team.color }}
                    onClick={() => handleTeamSelection(team)}
                  >
                    <div className="team-badge-small" style={{ backgroundColor: team.color }}>
                      {getTeamInitials(team.members)}
                    </div>
                    <span>{team.members}</span>
                  </button>
                ))}
              </div>
            ) : (
              <div className="points-input-section">
                <p>Award points to: <strong>{selectedTeamForPoints.members}</strong></p>
                <input
                  type="number"
                  min="1"
                  placeholder="Enter points"
                  value={pointsToAward}
                  onChange={(e) => setPointsToAward(e.target.value)}
                  className="points-input"
                  autoFocus
                />
                <div className="modal-buttons">
                  <button onClick={awardPoints} className="btn-confirm">Award Points</button>
                  <button onClick={() => setSelectedTeamForPoints(null)} className="btn-back">Back</button>
                </div>
              </div>
            )}

            <button onClick={() => {
              setSelectedChallenge(null)
              setSelectedTeamForPoints(null)
              setPointsToAward('')
            }} className="btn-close-modal">
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Password Modal */}
      {showPasswordModal && (
        <div className="modal-overlay" onClick={() => setShowPasswordModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h2>Enter Admin Password</h2>
            <input
              type="password"
              placeholder="Password"
              value={passwordInput}
              onChange={(e) => setPasswordInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleAdminLogin()}
              className="points-input"
              autoFocus
            />
            <div className="modal-buttons">
              <button onClick={handleAdminLogin} className="btn-confirm">Unlock</button>
              <button onClick={() => setShowPasswordModal(false)} className="btn-back">Cancel</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default App
