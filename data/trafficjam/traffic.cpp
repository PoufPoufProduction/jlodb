#include <string.h>
#include <stdlib.h>
#include <time.h>
#include <sys/time.h>
#include <math.h>
#include <iostream>
#include <iomanip>
#include <vector>
#include <list>

const static int maxCar[4] = {5,5,5,5};
static int nbFreeMax = 0;

class Grid {
public:
    class Car {
    public:
        int             pos_x, pos_y, size;
        bool            horiz;
        Car(int _pos_x, int _pos_y, int _size, bool _horiz):pos_x(_pos_x), pos_y(_pos_y), size(_size), horiz(_horiz) {}
        Car(int _size, bool _horiz):pos_x(0), pos_y(0), size(_size), horiz(_horiz) {}
        Car(Car * _car):pos_x(_car->pos_x), pos_y(_car->pos_y), size(_car->size), horiz(_car->horiz) {}
        int				getPos() const { return horiz?pos_x:pos_y; }
        void			dump() { std::cout<<"["<<horiz<<"] ("<<pos_x<<","<<pos_y<<"/"<<size<<") : "<<getPos()<<std::endl; }
    };

    int                 level;
    int                 tux;
    int *               g;
    int                 size_x, size_y, nb_free;
    std::vector<Car*>   cars;
    unsigned int        moved_cars;

    Grid(int _size_x, int _size_y):level(0),tux(0),g(0),size_x(_size_x),size_y(_size_y)
    {
        g = new int[ _size_x * _size_y];
        updateGrid();
        moved_cars = 0;
    }
    Grid(Grid * _grid):level(_grid->level+1),tux(_grid->tux),g(0),size_x(_grid->size_x),size_y(_grid->size_y),
                       moved_cars(_grid->moved_cars)
    {
        g = new int[ _grid->size_x * _grid->size_y];
        for (std::vector<Car*>::iterator it = _grid->cars.begin(); it!=_grid->cars.end(); it++) {
            addCar(new Car(*it));
        }
        updateGrid();
    }
    ~Grid() {
        for (std::vector<Car*>::iterator it = cars.begin(); it!=cars.end(); it++) { delete *it; }
        delete g;
    }

    void dump() {
        for (int j=0; j<size_y; j++) { for (int i=0; i<size_x; i++) { std::cout<<std::setw(2)<<g[i+j*size_x]; } std::cout<<std::endl; }
        std::cout<<std::endl;
    }

    void dumpGrid(int _level=0, int _count = 0) {
        int cc[4]={0,0,0,0};
        for (std::vector<Car*>::iterator it = cars.begin(); it!=cars.end(); it++) {
            int id = ((*it)->size-2)+((*it)->horiz?0:2);
            cc[id]++;
        }
        // EVALUATED DIFFICULTY
        int nb_moved_cars = 0;
        for (int i=0; i<cars.size(); i++) { if (moved_cars&(1<<i)) { nb_moved_cars++; }}
        int nb_fixed = cars.size()-nb_moved_cars;
        int ratio_fixed = 100*nb_fixed/cars.size();

        int difficulty = 5;
        if (_level<10)  { difficulty = 1; } else
        if (_level<15)  { difficulty = 2; } else
        if (_level<20)  { difficulty = 3; } else
        if (_level<25)  { difficulty = 4; }

        std::cout<<"<rdf:Description>"<<std::endl;
        std::cout<<"   <dct:identifier>"<<(rand()%100000)<<"</dct:identifier>"<<std::endl;
        std::cout<<"   <dct:title xml:lang=\"fr-FR\">En "<<_level<<" déplacements, faites sortir Tux et son kart de l'embouteillage ["<<checksum()<<"|"<<((cc[0]+cc[2])*2+(cc[1]+cc[3])*3)<<"/"<<(size_x*size_y)<<"|"<<ratio_fixed<<"%].</dct:title>"<<std::endl;
        std::cout<<"   <dct:description><![CDATA[";


        std::cout<<"\"cars\":[";
        bool first = true;
        for (std::vector<Car*>::iterator it = cars.begin(); it!=cars.end(); it++) {
            int value = 1;
            int i;
            if (!first) {
                i = ((*it)->size-2)+((*it)->horiz?0:2);
                value = 1+rand()%maxCar[i]+(i==0?1:0);
                std::cout<<",";
            }

            std::cout<<"[\""<<((*it)->horiz?"h":"v")<<(*it)->size<<"00"<<value<<"\","<<(*it)->pos_x<<","<<(*it)->pos_y<<"]";
            first = false;
        }
        std::cout<<"]";
        std::cout<<",\"objective\":"<<_level;

        std::cout<<"]]></dct:description>"<<std::endl;
        std::cout<<"   <dct:extent>2</dct:extent>"<<std::endl;
        std::cout<<"   <dct:subject>game</dct:subject>"<<std::endl;
        std::cout<<"   <dct:educationLevel>2</dct:educationLevel>"<<std::endl;
        std::cout<<"   <dct:type>"<<difficulty<<"</dct:type>"<<std::endl;
        std::cout<<"   <dct:alternative>001</dct:alternative>"<<std::endl;
        std::cout<<"</rdf:Description>"<<std::endl;
        std::cout<<std::endl;

    }

    unsigned long long checksum() {
        unsigned long long val = 0;
		for (std::vector<Car*>::iterator it = cars.begin(); it!=cars.end(); it++) {
			val+=(*it)->getPos();
			val*=(size_x-1);
		}
        return val;
    }

    void updateGrid() {
        nb_free = size_x * size_y;
        for (int i=0; i<size_x * size_y; i++) { g[i]=-1; }
        for (int i=0; i<cars.size(); i++) {
            int x = cars[i]->pos_x, y = cars[i]->pos_y;
            for (int j=0; j<cars[i]->size; j++) { g[x+y*size_x] = i; nb_free--; if (cars[i]->horiz) { x++; } else { y++; } }
        }
    }

    void addCar(Car * _car) {
        cars.push_back(_car);
        updateGrid();
    }

    void fill(int _goalline) {
        // TUX KART
        addCar(new Car(rand()%(size_x-3),_goalline,2,true));
        // OTHER CAR
        int tries = 0,max=10000,vX,vY,vSize;
        bool vHoriz, good;
        int vNbFreeMax = nbFreeMax;
        if (!vNbFreeMax) { vNbFreeMax = 3+rand()%10; }
        while (nb_free>vNbFreeMax && tries<max) {
            tries = 0;
            good = false;
            do {
                do {
                    vSize = (rand()%2==0)?2:3;
                    vHoriz = (rand()%2==1);
                    vX = rand()%(size_x-(vHoriz?vSize:1)+1);
                    vY = rand()%(size_y-(vHoriz?1:vSize)+1);
                } while (g[vX+vY*size_x]!=-1);

                // CHECK SPACE
                int vXX = vX, vYY=vY;
                good = true;
                for (int i=0; i<vSize; i++) { if (g[vXX+vYY*size_x]!=-1) { if (i==2) { vSize=2; } else { good = false; } } if (vHoriz) { vXX++; } else { vYY++; } }


                // NOT ON THE SAME LINE THAN TUX
                if (vHoriz && vY==_goalline) { good = false; }
                tries++;
            } while ( !good && tries<max);


            if (good) { addCar(new Car(vX, vY, vSize, vHoriz)); }

        };
    }
};

int main(int argc, char * argv[])
{
    unsigned int    argid   = 1;
    bool            finish  = false;
    bool            error   = 0;
    int             min     = 5;

    do {
        if (!(finish=(argid>=argc))) {

            if (!strcmp(argv[argid],"-m") && (++argid<argc))    { min = atoi(argv[argid]); }            else
            if (!strcmp(argv[argid],"-f") && (++argid<argc))    { nbFreeMax = atoi(argv[argid]); }      else
                                                                { error = true; }
        }
        argid++;
    } while(!finish);

    if (error) {
        std::cout<<"TRAFFICJAM @poufpoufproduction 2015"<<std::endl;
        std::cout<<"[usage] traffic -m [integer] -f [integer]"<<std::endl;
        return 0;
    }


    bool                found = false;
    int                 goalline = 2;
    int                 level = 0;
    unsigned long int   count;
    Grid *              attempt;
    timeval             t;

    gettimeofday(&t, NULL);
    srand(t.tv_usec);

do {
    found = false;
    Grid * grid = new Grid(6,6);

    // EASY #1
    //grid->addCar(new Grid::Car(0, 2, 2, true));grid->addCar(new Grid::Car(3, 1, 2, true));grid->addCar(new Grid::Car(1, 3, 2, false));grid->addCar(new Grid::Car(4, 2, 2, false));grid->addCar(new Grid::Car(1, 0, 3, true));grid->addCar(new Grid::Car(2, 5, 3, true));grid->addCar(new Grid::Car(3, 2, 3, false));grid->addCar(new Grid::Car(5, 1, 3, false));

    // EASY #50
    //grid->addCar(new Grid::Car(1, 2, 2, true));grid->addCar(new Grid::Car(3, 0, 2, true));grid->addCar(new Grid::Car(3, 4, 2, true));grid->addCar(new Grid::Car(4, 3, 2, true));grid->addCar(new Grid::Car(2, 0, 2, false));grid->addCar(new Grid::Car(4, 1, 2, false));grid->addCar(new Grid::Car(5, 4, 2, false));grid->addCar(new Grid::Car(2, 5, 3, true));grid->addCar(new Grid::Car(0, 1, 3, false));grid->addCar(new Grid::Car(3, 1, 3, false));

    // EASY #100
    //grid->addCar(new Grid::Car(0, 2, 2, true));grid->addCar(new Grid::Car(2, 1, 2, true));grid->addCar(new Grid::Car(4, 4, 2, true));grid->addCar(new Grid::Car(2, 3, 2, false));grid->addCar(new Grid::Car(3, 2, 2, false));grid->addCar(new Grid::Car(3, 4, 2, false));grid->addCar(new Grid::Car(5, 2, 2, false));grid->addCar(new Grid::Car(4, 1, 3, false));

    // NORMAL #1
    // grid->addCar(new Grid::Car(1, 2, 2, true));grid->addCar(new Grid::Car(4, 4, 2, true));grid->addCar(new Grid::Car(0, 1, 2, false));grid->addCar(new Grid::Car(3, 1, 2, false));grid->addCar(new Grid::Car(4, 1, 2, false));grid->addCar(new Grid::Car(1, 3, 2, false));grid->addCar(new Grid::Car(3, 4, 2, false));grid->addCar(new Grid::Car(0, 5, 3, true));grid->addCar(new Grid::Car(2, 3, 3, true));grid->addCar(new Grid::Car(5, 1, 3, false));

    // HARD #1
    //grid->addCar(new Grid::Car(2, 2, 2, true));grid->addCar(new Grid::Car(2, 0, 2, true));grid->addCar(new Grid::Car(4, 0, 2, true));grid->addCar(new Grid::Car(3, 3, 2, true));grid->addCar(new Grid::Car(4, 4, 2, true));grid->addCar(new Grid::Car(4, 1, 2, false));grid->addCar(new Grid::Car(0, 3, 2, false));grid->addCar(new Grid::Car(3, 4, 2, false));grid->addCar(new Grid::Car(2, 3, 3, false));grid->addCar(new Grid::Car(5, 1, 3, false));

    // HARD #100
    //grid->addCar(new Grid::Car(2, 2, 2, true));grid->addCar(new Grid::Car(4, 0, 2, true));grid->addCar(new Grid::Car(1, 3, 2, true));grid->addCar(new Grid::Car(3, 4, 2, true));grid->addCar(new Grid::Car(0, 0, 2, false));grid->addCar(new Grid::Car(3, 0, 2, false));grid->addCar(new Grid::Car(2, 4, 2, false));grid->addCar(new Grid::Car(3, 5, 3, true));grid->addCar(new Grid::Car(0, 3, 3, false));grid->addCar(new Grid::Car(1, 0, 3, false));grid->addCar(new Grid::Car(4, 1, 3, false));grid->addCar(new Grid::Car(5, 2, 3, false));

	// AUTOMATIC
    grid->fill(goalline);

    attempt = new Grid(grid);

    std::list<Grid *> grids;
    std::vector<unsigned long long> checksums;

    grids.push_back(grid);
    checksums.push_back(grid->checksum());

    count=0;

    do {

    grid = grids.front();
    grids.pop_front();

    // Try to solve the grid
    std::vector<std::pair<int,int> > moves;
    for (int i=0; i<grid->cars.size(); i++) {
        int j;
        if (grid->cars[i]->horiz) {
            j = grid->cars[i]->pos_x-1;
            while (j>=0 && grid->g[j+grid->cars[i]->pos_y*grid->size_x]==-1) {
                moves.push_back(std::pair<int,int>(i,j-grid->cars[i]->pos_x));
                j--;
            }
            j = grid->cars[i]->pos_x+ grid->cars[i]->size;
            while (j<grid->size_x && grid->g[j+grid->cars[i]->pos_y*grid->size_x]==-1) {
                moves.push_back(std::pair<int,int>(i,j-grid->cars[i]->pos_x - grid->cars[i]->size + 1));
                j++;
            }
        }
        else {
            j = grid->cars[i]->pos_y-1;
            while (j>=0 && grid->g[j*grid->size_x+grid->cars[i]->pos_x]==-1) {
                moves.push_back(std::pair<int,int>(i,j-grid->cars[i]->pos_y));
                j--;
            }
            j = grid->cars[i]->pos_y+ grid->cars[i]->size;
            while (j<grid->size_y && grid->g[j*grid->size_x+grid->cars[i]->pos_x]==-1) {
                moves.push_back(std::pair<int,int>(i,j-grid->cars[i]->pos_y - grid->cars[i]->size + 1));
                j++;
            }
        }
    }

    for (int i=0; i<moves.size(); i++) {
        Grid * newgrid = new Grid(grid);

        Grid::Car * car = newgrid->cars[moves[i].first];
        if (car->horiz) { car->pos_x += moves[i].second; } else { car->pos_y += moves[i].second; }
        newgrid->updateGrid();

        newgrid->moved_cars |= 1<<moves[i].first;

        if (moves[i].first==0) { newgrid->tux = newgrid->tux+1; }

        unsigned long long newchecksum = newgrid->checksum();
        bool already = false;
        for (int j=0; j<checksums.size(); j++) { if (checksums[j]==newchecksum) { already=true; } }

        if (newgrid->g[newgrid->size_x-1+goalline*newgrid->size_x]==0) {
            found = true;
            level = newgrid->level;
            attempt->tux = newgrid->tux;
            attempt->moved_cars = newgrid->moved_cars;
        }

        if (already) { delete newgrid; }
        else         { grids.push_back(newgrid); checksums.push_back(newchecksum); }

        if (found) { break; }
    }
    delete grid;

    count++;
}
while (found==false && grids.size()>0 && count<20000);

    for (std::list<Grid *>::iterator it = grids.begin(); it != grids.end(); it++) { delete *it; }

}
while (found==false || level<min);

attempt->dumpGrid(level, count);



    return 1;
}
