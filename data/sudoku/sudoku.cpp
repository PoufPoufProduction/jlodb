#include <string.h>
#include <stdlib.h>
#include <time.h>
#include <sys/time.h>
#include <iostream>

enum mode   { classic_ = 0, grid_, mask_, qqwing_, jlodb_, debug_, raw_, alpha_, complete_ };
char alpha[] = { '.', 'a', 'b', 'c', 'd', 'e', 'f', 'g', 'h', 'i' };

#define uchar           unsigned char
#define ushort          unsigned short

/** A Sudoku grid (may be complete, uncomplete, right or wrong) */
class grid
{
private:
    uchar   candidates[92];     // 9x9x9 bits = 729 bits = 92 bytes (-7 useless bits)
    uchar   mask[11];           // 9x9 bits = 81 bits = 11 bytes    (-7 useless bits)

    inline ushort   bit(uchar _i, uchar _j, uchar _val=0) const { return _val?(_val-1)+(_i+_j*9)*9:_i+_j*9; }
    inline bool     isc(ushort _b) const                        { return (candidates[_b>>3]&(1<<(_b%8))); }
    inline bool     ism(ushort _b) const                        { return (mask[_b>>3]&(1<<(_b%8))); }
    inline void     setc(ushort _b)                             { candidates[_b>>3]&=~(1<<(_b%8)); }
    inline void     setm(ushort _b)                             { mask[_b>>3]|=(1<<(_b%8)); }

public:
    grid() { clear(); }
    grid(const grid & _grid) { copy(_grid); }

    /** clear the grid */
    void clear() { 
        memset(candidates,255,92*sizeof(uchar));
        memset(mask,0,11*sizeof(uchar));
    }

    /** Copy a grid */
    void copy(const grid &_grid, bool _mask = true) {
        memcpy(candidates, _grid.candidates, 92*sizeof(uchar));
        if (_mask) { memcpy(mask, _grid.mask, 11*sizeof(uchar)); }
    }

    /** @return true if the _value is still candidate in the (_i,_j) cell */
    bool isCandidate(uchar _i, uchar _j, uchar _value) const { return isc(bit(_i,_j,_value)); }

    /** @return true if (_i,_j) is in the mask */
    bool isInMask(uchar _i, uchar _j) const { return ism(bit(_i,_j)); }

    /** @return value [1-9] if only one candidate on (_i,_j) else 0 */
    uchar get(uchar _i, uchar _j) const {
        uchar ret = 0;
        for (uchar i = 1; i<=9 & ret!=10; i++) if (isc(bit(_i,_j,i))) ret = ret?10:i;
        return ret%10;
    }

    /** @return the number of candidates for cell (_i,_j) */
    uchar nbCandidates(uchar _i, uchar _j) const {
        uchar ret = 0;
        for (uchar i=1; i<=9; i++) if (isc(bit(_i,_j,i))) ret++;
        return ret;
    }

    /** @return a candidate */
    uchar getCandidate(uchar _i, uchar _j,uchar _index) const {
        uchar ret   = 0;
        uchar nb    = 0;
        for (uchar i=1; i<=9; i++) if (isc(bit(_i,_j,i))) { if (nb==_index) { ret = i; } nb++; }
        return ret;
    }

    /** @return true if set a random candidate in cell (_i,_j) */
    bool setRandomCandidate(uchar _i, uchar _j)
    {
        bool ret = false;
        if (!isInMask(_i,_j) && nbCandidates(_i,_j)) {
            int index = rand()%nbCandidates(_i,_j);
            ret = set(_i,_j,getCandidate(_i,_j,index));
        }
        return ret;
    }

    /** @return the (_i,_j) cell with the less candidates (only more than 1) */
    uchar small(uchar & _i, uchar &_j) const {
        uchar nb = 10;
        for (uchar j=0; j<9; j++) for (uchar i=0; i<9; i++) {
            uchar tmp = nbCandidates(i,j);
            if (tmp>1 && tmp<nb) { nb = tmp; _i = i; _j = j; }
        }
        return (nb!=10)?nb:0;
    }

    /** @return number of cell in mask */
    uchar maskSize() const {
        uchar ret = 0;
        for (uchar j=0; j<9; j++) for (uchar i=0; i<9; i++) if (isInMask(i,j)) ret++;
        return ret;
    }

    /** @return true if the grid is still valid (all cases have one candidate at least) */
    bool valid() const
    {
        bool ret = true;
        for (int j=0; j<9; j++) for (int i=0; i<9; i++) {
            int c = 0; for (int val=1; val<10; val++) { c+=isc(bit(i,j,val)); } ret&=(c>0);
        }
        return ret;
    }

    /** @return true if the grid as only one candidate per cell */
    bool complete() const
    {
        bool ret = true;
        for (int j=0; j<9; j++) for (int i=0; i<9; i++) {
            int c = 0; for (int val=1; val<10; val++) { c+=isc(bit(i,j,val)); } ret&=(c==1);
        }
        return ret;
    }


    /** @return true if the value is still a candidate for [_i,_j]. Update the candidates */
    bool set(uchar _i, uchar _j, uchar _val, bool _mask = true)
    {
        bool ret = (_val==0) || (isc(bit(_i,_j,_val)));
        if (ret && (_val!=0)) {
            for (int i=0; i<9; i++) {
                if (i!=_val-1)  { setc(bit(_i,_j,(i+1))); }   // Remove all other candidates for this cell
                if (i!=_j)      { setc(bit(_i,i,_val)); }     // Remove the value of all candidates on the same column
                if (i!=_i)      { setc(bit(i,_j,_val)); }     // Remove the value of all candidates on the same line
            }
            // Remove the value of all candidates on the same group
            uchar  gi     = _i/3;     // group i-axis index
            uchar  gj     = _j/3;     // group j-axis index
            for (uchar i=0; i<3; i++) for (uchar j=0; j<3; j++) if ((i!=_i%3)||(j!=_j%3)) { setc(bit(gi*3+i,gj*3+j,_val)); }

            if (_mask) { setm(bit(_i,_j)); }
        }
        return ret;
    }

    /** dump the grid */
    void dump(mode _mode = classic_) {
        switch(_mode)
        {
        case classic_:
            for (int j=0; j<9; j++) { for (int i=0; i<9; i++) std::cout<<static_cast<int>(get(i,j)); std::cout<<std::endl; } break;
        case grid_:
            for (int j=0; j<9; j++) {
                for (int i=0; i<9; i++) {
                    std::cout<<" ";
                    if (ism(bit(i,j))) std::cout<<static_cast<int>(get(i,j)); else std::cout<<".";
                    if (i==2 || i==5) { std::cout<<" |"; }
                }
                std::cout<<std::endl;
                if (j==2 || j==5) { std::cout<<"-------+-------+-------"<<std::endl; }
            }  break;
        case alpha_ :
            for (int j=0; j<9; j++) for (int i=0; i<9; i++)
                if (ism(bit(i,j))) std::cout<<static_cast<int>(get(i,j)); else std::cout<<alpha[get(i,j)]; std::cout<<std::endl; break;
        case qqwing_ :
            for (int j=0; j<9; j++) for (int i=0; i<9; i++)
                if (ism(bit(i,j))) std::cout<<static_cast<int>(get(i,j)); else std::cout<<"."; std::cout<<std::endl; break;
        case raw_ :
            for (int j=0; j<9; j++) for (int i=0; i<9; i++)
                if (ism(bit(i,j))) std::cout<<static_cast<int>(get(i,j)); else std::cout<<"0"; std::cout<<std::endl; break;
        case mask_:
            for (int j=0; j<9; j++) { for (int i=0; i<9; i++) std::cout<<((ism(bit(i,j)))?"X":" "); std::cout<<std::endl; }  break;
        case debug_:
            std::cout<<"-------------------------------------"<<std::endl;
            for (uchar j=0; j<27; j++) {
                std::cout<<"|";
                for (uchar i=0; i<27; i++) {
                    uchar _i = i/3;
                    uchar _j = j/3;
                    uchar _val = 1+(i%3+3*(j%3));
                    if (isc(bit(_i,_j,_val))) { std::cout<<static_cast<int>(_val); } else { std::cout<<" "; }
                    if (i%3==2) { std::cout<<"|";}
                }
                std::cout<<std::endl;
                if (j%3==2) { std::cout<<"-------------------------------------"<<std::endl; }
            }
        break;
        case complete_:
            std::cout<<"% randomly generated ("<<(int)maskSize()<<") (id: "<<(rand()%100000)<<")"<<std::endl;
            dump(grid_);
            //dump(raw_);
            dump(qqwing_);
            dump(alpha_);
            break;
        }
    }
};

bool solve(grid & g, int _level = 0)
{
    static bool     good;
    bool            cont;

    if (_level==0)          { good = true; }
    if (_level>=10 || !good) { good = false; return false; }

    do {
        // update singleton
        do {
            cont = false;
            for (uchar j=0; j<9; j++) for (uchar i=0; i<9; i++) if (g.get(i,j) && !g.isInMask(i,j)) { cont|=g.set(i,j,g.get(i,j)); }
        } while(cont);

        // for each value, find unique possibility in row, col or group
        cont = false;
        for (uchar val=1; val<=9; val++) for (uchar i=0; i<9; i++) {
            char rowid=-1, colid=-1, groupid=-1;
            for (uchar j=0; j<9; j++) {
                if (g.isCandidate(i,j,val)) { rowid = (rowid==-1)?j:-2; }
                if (g.isCandidate(j,i,val)) { colid = (colid==-1)?j:-2; }

                uchar _i = (i%3)*3+(j%3);
                uchar _j = static_cast<int>(i/3)*3 + static_cast<int>(j/3);
                if (g.isCandidate(_i,_j,val)) { groupid= (groupid==-1)?j:-2; }

            }
            if (rowid>=0 && !g.isInMask(i,rowid)) { cont|=g.set(i,rowid,val); }
            if (colid>=0 && !g.isInMask(colid,i)) { cont|=g.set(colid,i,val); }

            uchar _i = (i%3)*3+(groupid%3);
            uchar _j = static_cast<int>(i/3)*3 + static_cast<int>(groupid/3);
            if (groupid>=0 && !g.isInMask(_i,_j)) { cont|=g.set(_i,_j,val); }
        }
    }
    while(cont);

    bool ret = g.valid();

    if (ret && !g.complete()) {
        ret = false;
        // TRY POSSIBILITIES
        uchar i,j;
        if (g.small(i,j)) {
            uchar   valids = 0;
            grid    tmp;
            for (uchar val=1; val<=9; val++) if (good && valids<2 && g.isCandidate(i,j,val)) {
                grid g2(g);
                g2.set(i,j,val);
                if (solve(g2, _level+1)) { ret = true; tmp.copy(g2); valids++; }
            }
            if (valids>1) { good = false; }
            if (valids==1) { g.copy(tmp); }
        }
    }

    return ret && good;
}


int main(int argc, char * argv[])
{
    grid g;

    unsigned int    argid   = 1;
    bool            finish  = false;
    int             error   = 0;
    bool            gen     = false;
    int             min     = 14;
    int             max     = 60;
    int             sym     = 0;        // 0:none, 1:horiz, 2: vert, 3; central, 4: diag, 9; total
    bool            init    = false;

    do {
        if (!(finish=(argid>=argc))) {

            if (!strcmp(argv[argid],"-i") && (++argid<argc)) {
                init = true;
                for (int i=0; i<strlen(argv[argid]); i++)  {
                    uchar val = 0;
                    if (argv[argid][i]>'0' && argv[argid][i]<='9') { val = argv[argid][i]-'0'; }
                    if (!g.set(i%9, i/9, val)) { error = 1; }
                }
            } else
            if (!strcmp(argv[argid],"-s") && (++argid<argc)) {
                sym = atoi(argv[argid]);
            } else
            if (!strcmp(argv[argid],"-m") && (++argid<argc)) {
                min = atoi(argv[argid]);
            } else
            if (!strcmp(argv[argid],"-M") && (++argid<argc)) {
                max = atoi(argv[argid]);
            } else
            if (!strcmp(argv[argid],"-g")) { gen = true; }

        }
        argid++;
    } while(!finish);

    if (error) {
        std::cout<<"error("<<error<<")"<<std::endl;
    }
    else {
        if (gen) {
            std::cout<<"SUDOKU Generator ("<<min<<"/"<<max<<") (sym:"<<sym<<")"<<std::endl;

            timeval t;
            gettimeofday(&t, NULL);
            srand(t.tv_usec);

            uchar nb = 0;
            bool cont = true;
            do {
                if (nb>max || !g.valid()) { nb=0; g.clear(); }

                int i,j;

                if ((min%2)&&!g.isInMask(4,4)) { i=4; j=4; }
                else { do { i=rand()%9; j=rand()%9; } while (g.isInMask(i,j)); }

                if (g.setRandomCandidate(i,j)) nb++;
                if (sym==1 || sym==5) { if (g.setRandomCandidate(i,8-j)) nb++; }
                if (sym==2 || sym==5) { if (g.setRandomCandidate(8-i,j)) nb++; }
                if (sym==3 || sym==4 || sym==5) {
                    if (g.setRandomCandidate(8-i,8-j)) nb++;
                }
                if (sym==4 || sym==5 ) {
                    if (g.setRandomCandidate(j,i)) nb++;
                    if (g.setRandomCandidate(8-j,8-i)) nb++;
                }
                if (sym==5) {
                    if (g.setRandomCandidate(j,8-i)) nb++;
                    if (g.setRandomCandidate(8-j,i)) nb++;
                }

                if (nb>=min) {
                    grid g2(g);
                    bool ret = solve(g2);
                    if (ret && g2.complete() && g2.valid()) { g.copy(g2,false); cont = false; }
                } 
            } while(cont);
            g.dump(complete_);
        }
        else if (init) {
            std::cout<<"SUDOKU Solver"<<std::endl;
            grid g2(g);
            bool ret = solve(g2);
            if (ret && g2.complete() && g2.valid()) { g.copy(g2,false); g.dump(); }
            else { std::cout<<"no unique solution"<<std::endl; }
        }
        else {
            std::cout<<"SUDOKU @poufpoufproduction 2013"<<std::endl;
            std::cout<<"[usage] sudoku -i [grid] -g -m [integer] -s [0,1,2,3,4,5]"<<std::endl;
        }
    }

    return 1;
}
