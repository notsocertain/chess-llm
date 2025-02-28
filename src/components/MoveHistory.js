import React from 'react';
import '../styles/MoveHistory.css';

const MoveHistory = ({ moves }) => {
  return (
    <div className="move-history">
      <h3>Move History</h3>
      <div className="move-list">
        {moves.length === 0 ? (
          <p className="no-moves">No moves yet</p>
        ) : (
          <table>
            <thead>
              <tr>
                <th>#</th>
                <th>White</th>
                <th>Black</th>
              </tr>
            </thead>
            <tbody>
              {Array.from({ length: Math.ceil(moves.length / 2) }).map((_, index) => {
                const moveNumber = index + 1;
                const whiteMove = moves[index * 2];
                const blackMove = moves[index * 2 + 1];
                
                return (
                  <tr key={moveNumber} className={moveNumber % 2 === 0 ? 'even-row' : 'odd-row'}>
                    <td className="move-number">{moveNumber}.</td>
                    <td className="white-move">{whiteMove?.notation || ''}</td>
                    <td className="black-move">{blackMove?.notation || ''}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};

export default MoveHistory;
